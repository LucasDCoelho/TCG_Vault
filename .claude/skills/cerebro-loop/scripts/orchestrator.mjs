#!/usr/bin/env node

/**
 * Cerebro Loop — Orchestrator
 * 
 * State machine for the SDD loop pipeline.
 * Manages STATE.json, phase transitions, circuit breakers, and harness checks.
 * Supports ROADMAP batch execution — process all features sequentially.
 * 
 * Usage:
 *   node orchestrator.mjs init <feature-name> [scope]
 *   node orchestrator.mjs status [feature-name]
 *   node orchestrator.mjs next [feature-name]
 *   node orchestrator.mjs heal <task-id> [feature-name]
 *   node orchestrator.mjs check [feature-name]
 *   node orchestrator.mjs pause [feature-name]
 *   node orchestrator.mjs resume [feature-name]
 *   node orchestrator.mjs report [feature-name]
 *   node orchestrator.mjs roadmap [roadmap-path]
 *   node orchestrator.mjs roadmap-run [roadmap-path] [--scope <scope>]
 *   node orchestrator.mjs roadmap-status [roadmap-path]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPECS_DIR = join(process.cwd(), '.specs');
const LOOP_DIR = join(SPECS_DIR, 'loop');
const FEATURES_DIR = join(SPECS_DIR, 'features');
const PROJECT_DIR = join(SPECS_DIR, 'project');

// ─── Config ───────────────────────────────────────────────────────────────────

const SCOPE_CONFIG = {
  medium: {
    maxCycles: 2,
    maxTokens: 15000,
    maxTime: 15 * 60 * 1000,
    maxParallelAgents: 1,
    maxHealAttempts: 1,
    skipDesign: true,
    skipTasks: true,
  },
  large: {
    maxCycles: 4,
    maxTokens: 35000,
    maxTime: 30 * 60 * 1000,
    maxParallelAgents: 3,
    maxHealAttempts: 2,
    skipDesign: false,
    skipTasks: false,
  },
  complex: {
    maxCycles: 6,
    maxTokens: 60000,
    maxTime: 60 * 60 * 1000,
    maxParallelAgents: 5,
    maxHealAttempts: 3,
    skipDesign: false,
    skipTasks: false,
  },
};

const PHASES = ['spec', 'design', 'tasks', 'implement', 'test', 'heal', 'deliver'];

const PHASE_ORDER = {
  medium: ['spec', 'implement', 'test', 'heal', 'deliver'],
  large: ['spec', 'tasks', 'implement', 'test', 'heal', 'deliver'],
  complex: ['spec', 'design', 'tasks', 'implement', 'test', 'heal', 'deliver'],
};

const CIRCUIT_BREAKERS = {
  maxConsecutiveFailures: 5,
  maxTaskFailures: 3,
  maxCyclesWithoutProgress: 2,
  maxScopeDivergence: 3,
};

// ─── State Management ─────────────────────────────────────────────────────────

function getStatePath(feature) {
  return join(LOOP_DIR, `${feature}`, 'STATE.json');
}

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function loadState(feature) {
  const statePath = getStatePath(feature);
  if (!existsSync(statePath)) {
    return null;
  }
  return JSON.parse(readFileSync(statePath, 'utf-8'));
}

function saveState(feature, state) {
  const statePath = getStatePath(feature);
  ensureDir(dirname(statePath));
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf-8');
}

function createState(feature, scope = 'large') {
  const config = SCOPE_CONFIG[scope] || SCOPE_CONFIG.large;
  return {
    feature,
    scope,
    config,
    phase: 'spec',
    cycle: 1,
    startTime: new Date().toISOString(),
    budgetUsed: { tokens: 0, time: 0 },
    budgetLimit: { tokens: config.maxTokens, time: config.maxTime },
    tasks: {},
    healingLog: [],
    transitions: [],
    circuitBreakers: {
      currentFailures: 0,
      consecutiveFailures: 0,
      taskFailures: {},
      cyclesWithoutProgress: 0,
      scopeDivergence: 0,
    },
    status: 'running',
  };
}

// ─── ROADMAP Parsing ──────────────────────────────────────────────────────────

function findRoadmapFile(requestedPath) {
  if (requestedPath && existsSync(requestedPath)) {
    return requestedPath;
  }

  const candidates = [
    join(PROJECT_DIR, 'ROADMAP.md'),
    join(SPECS_DIR, 'ROADMAP.md'),
    join(process.cwd(), 'ROADMAP.md'),
    join(process.cwd(), '.specs', 'ROADMAP.md'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function parseRoadmap(roadmapPath) {
  const content = readFileSync(roadmapPath, 'utf-8');
  const lines = content.split('\n');
  const features = [];
  let currentMilestone = null;
  let currentSection = null;

  // Priority mapping from text
  const priorityMap = {
    'alta': 'high',
    'high': 'high',
    'urgente': 'high',
    'média': 'medium',
    'media': 'medium',
    'medium': 'medium',
    'média-alta': 'high',
    'baixa': 'low',
    'low': 'low',
    'futuro': 'deferred',
    'future': 'deferred',
  };

  // Scope mapping from text
  const scopeMap = {
    'pequeno': 'medium',
    'small': 'medium',
    'médio': 'medium',
    'medium': 'medium',
    'grande': 'large',
    'large': 'large',
    'complexo': 'complex',
    'complex': 'complex',
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect milestone headers: ### v1.0, ## Milestone X, ## v2.0
    const milestoneMatch = trimmed.match(/^#{2,3}\s+(?:v[\d.]+|milestone[:\s]*(.+))/i);
    if (milestoneMatch) {
      currentMilestone = milestoneMatch[1] || trimmed.replace(/^#{2,3}\s+/, '');
      continue;
    }

    // Detect section headers: ## Features, ## Backlog, etc.
    const sectionMatch = trimmed.match(/^##\s+(.+)/);
    if (sectionMatch && !milestoneMatch) {
      currentSection = sectionMatch[1].trim();
      continue;
    }

    // Detect feature items: - [ ] name — priority, - [x] name (done)
    const featureMatch = trimmed.match(/^-\s+\[([ xX])\]\s+(.+)/);
    if (featureMatch) {
      const done = featureMatch[1].toLowerCase() === 'x';
      let rawName = featureMatch[2].trim();

      // Extract priority from inline text
      let priority = 'medium';
      let scope = null;
      let description = rawName;

      // Look for priority markers: — alta, (prioridade alta), [alta]
      const priorityPatterns = [
        /[—–-]\s*(alta|high|urgente|média|media|medium|baixa|low|futuro|future)/i,
        /\(prioridade[:\s]*(alta|high|urgente|média|media|medium|baixa|low)\)/i,
        /\[(alta|high|urgente|média|media|medium|baixa|low)\]/i,
      ];

      for (const pattern of priorityPatterns) {
        const match = rawName.match(pattern);
        if (match) {
          priority = priorityMap[match[1].toLowerCase()] || 'medium';
          description = rawName.replace(pattern, '').trim();
          break;
        }
      }

      // Look for scope markers
      const scopePatterns = [
        /[—–-]\s*(complexo|complex|grande|large|médio|medium|pequeno|small)/i,
        /\[(complexo|complex|grande|large|médio|medium|pequeno|small)\]/i,
      ];

      for (const pattern of scopePatterns) {
        const match = rawName.match(pattern);
        if (match) {
          scope = scopeMap[match[1].toLowerCase()] || null;
          description = description.replace(pattern, '').trim();
          break;
        }
      }

      // Clean up separators and extra whitespace
      description = description
        .replace(/\s*[—–-]\s*$/, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Generate feature slug from name
      const slug = description
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      features.push({
        name: description,
        slug,
        done,
        priority,
        scope,
        milestone: currentMilestone,
        section: currentSection,
        raw: rawName,
      });
    }
  }

  return {
    path: roadmapPath,
    total: features.length,
    done: features.filter(f => f.done).length,
    pending: features.filter(f => !f.done).length,
    features,
  };
}

// ─── Harness Checks ───────────────────────────────────────────────────────────

function checkHarness(state) {
  const { budgetUsed, budgetLimit, circuitBreakers } = state;

  // Budget checks
  if (budgetUsed.tokens >= budgetLimit.tokens) {
    return { action: 'STOP', reason: 'BUDGET_TOKENS_EXCEEDED', detail: `${budgetUsed.tokens}/${budgetLimit.tokens} tokens` };
  }

  const elapsed = Date.now() - new Date(state.startTime).getTime();
  if (elapsed >= budgetLimit.time) {
    return { action: 'STOP', reason: 'BUDGET_TIME_EXCEEDED', detail: `${Math.round(elapsed / 1000)}s/${Math.round(budgetLimit.time / 1000)}s` };
  }

  // Circuit breaker: consecutive failures
  if (circuitBreakers.consecutiveFailures >= CIRCUIT_BREAKERS.maxConsecutiveFailures) {
    return { action: 'STOP', reason: 'CONSECUTIVE_FAILURES', detail: `${circuitBreakers.consecutiveFailures}/${CIRCUIT_BREAKERS.maxConsecutiveFailures}` };
  }

  // Circuit breaker: cycles without progress
  if (circuitBreakers.cyclesWithoutProgress >= CIRCUIT_BREAKERS.maxCyclesWithoutProgress) {
    return { action: 'STOP', reason: 'NO_PROGRESS', detail: `${circuitBreakers.cyclesWithoutProgress} cycles without progress` };
  }

  // Circuit breaker: scope divergence
  if (circuitBreakers.scopeDivergence >= CIRCUIT_BREAKERS.maxScopeDivergence) {
    return { action: 'STOP', reason: 'SCOPE_CREEP', detail: `${circuitBreakers.scopeDivergence}/${CIRCUIT_BREAKERS.maxScopeDivergence}` };
  }

  // Budget warning at 70%
  if (budgetUsed.tokens >= budgetLimit.tokens * 0.7) {
    return { action: 'COMPACT', reason: 'BUDGET_70_PERCENT', detail: `${budgetUsed.tokens}/${budgetLimit.tokens} tokens` };
  }

  return { action: 'OK', reason: 'ALL_CLEAR' };
}

// ─── Phase Transitions ────────────────────────────────────────────────────────

function getNextPhase(state) {
  const order = PHASE_ORDER[state.scope] || PHASE_ORDER.large;
  const currentIndex = order.indexOf(state.phase);
  
  if (currentIndex === -1) {
    return { next: order[0], isCycleComplete: false };
  }

  // Find next non-skipped phase
  for (let i = currentIndex + 1; i < order.length; i++) {
    const candidate = order[i];
    
    // Skip heal if no failures
    if (candidate === 'heal' && state.circuitBreakers.currentFailures === 0) {
      continue;
    }
    
    return { next: candidate, isCycleComplete: candidate === 'deliver' };
  }

  // End of cycle — restart or complete
  if (state.cycle < state.config.maxCycles) {
    return { next: 'spec', isCycleComplete: true, newCycle: state.cycle + 1 };
  }

  return { next: null, isCycleComplete: true, loopComplete: true };
}

function transition(state, toPhase, gateResult = 'pass') {
  const elapsed = Date.now() - new Date(state.startTime).getTime();
  
  state.transitions.push({
    from: state.phase,
    to: toPhase,
    cycle: state.cycle,
    timestamp: new Date().toISOString(),
    gateResult,
    tokensUsed: state.budgetUsed.tokens,
    elapsed: Math.round(elapsed / 1000),
  });

  state.phase = toPhase;

  if (gateResult === 'pass') {
    state.circuitBreakers.currentFailures = 0;
    state.circuitBreakers.consecutiveFailures = 0;
  }

  if (gateResult === 'fail') {
    state.circuitBreakers.currentFailures++;
    state.circuitBreakers.consecutiveFailures++;
  }

  return state;
}

// ─── Commands: Single Feature ─────────────────────────────────────────────────

function cmdInit(feature, scope = 'large') {
  const existing = loadState(feature);
  if (existing && existing.status === 'running') {
    console.log(`⚠️  Loop já está rodando para "${feature}" fase ${existing.phase} ciclo ${existing.cycle}.`);
    console.log(`   Retomar com: node orchestrator.mjs resume ${feature}`);
    console.log(`   Ou recomeçar com: node orchestrator.mjs init ${feature} ${scope} --force`);
    return;
  }

  const state = createState(feature, scope);
  saveState(feature, state);

  const config = SCOPE_CONFIG[scope];
  console.log(`✅ Loop inicializado para "${feature}"`);
  console.log(`   Escopo: ${scope}`);
  console.log(`   Fases: ${PHASE_ORDER[scope].join(' → ')}`);
  console.log(`   Ciclos máximos: ${config.maxCycles}`);
  console.log(`   Budget: ${config.maxTokens} tokens / ${config.maxTime / 60000} min`);
  console.log(`   Paralelismo: até ${config.maxParallelAgents} agentes`);
  console.log(`   Self-healing: ${config.maxHealAttempts} tentativas por tarefa`);
  console.log(`\n   Próxima ação: Fase SPEC (ciclo 1)`);
}

function cmdStatus(feature) {
  const state = loadState(feature);
  if (!state) {
    console.log(`❌ Nenhum loop encontrado para "${feature}".`);
    console.log(`   Iniciar com: node orchestrator.mjs init <feature> [scope]`);
    return;
  }

  const harness = checkHarness(state);
  const elapsed = Math.round((Date.now() - new Date(state.startTime).getTime()) / 1000);
  const tasks = Object.values(state.tasks);
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

  console.log(`\n═══ Loop Status: ${state.feature} ═══`);
  console.log(`Status:    ${state.status}`);
  console.log(`Fase:      ${state.phase}`);
  console.log(`Ciclo:     ${state.cycle}/${state.config.maxCycles}`);
  console.log(`Tempo:     ${elapsed}s`);
  console.log(`Tokens:    ${state.budgetUsed.tokens}/${state.budgetLimit.tokens}`);
  console.log(`Tasks:     ${doneTasks} done / ${tasks.length} total / ${blockedTasks} blocked`);
  console.log(`Healings:  ${state.healingLog.length}`);
  console.log(`Failures:  ${state.circuitBreakers.consecutiveFailures} consecutive`);
  console.log(`Harness:   ${harness.action} — ${harness.reason}`);
  
  if (harness.action === 'STOP') {
    console.log(`\n⚠️  CIRCUIT BREAKER ATIVO: ${harness.detail}`);
  }

  if (harness.action === 'COMPACT') {
    console.log(`\n⚠️  COMPACTAÇÃO RECOMENDADA: ${harness.detail}`);
  }

  console.log(`\nTransições:`);
  for (const t of state.transitions.slice(-5)) {
    console.log(`  [${t.cycle}] ${t.from} → ${t.to} (${t.gateResult})`);
  }
  console.log('');
}

function cmdNext(feature) {
  const state = loadState(feature);
  if (!state) {
    console.log(`❌ Nenhum loop encontrado para "${feature}".`);
    return;
  }

  // Harness check
  const harness = checkHarness(state);
  if (harness.action === 'STOP') {
    console.log(`🛑 LOOP PARADO — ${harness.reason}: ${harness.detail}`);
    console.log(`   Operador precisa intervencionar.`);
    state.status = 'paused';
    saveState(feature, state);
    return;
  }

  if (harness.action === 'COMPACT') {
    console.log(`⚠️  COMPACTAÇÃO: ${harness.detail}. Compactar contexto antes de continuar.`);
  }

  // Get next phase
  const { next, isCycleComplete, newCycle, loopComplete } = getNextPhase(state);

  if (loopComplete) {
    console.log(`✅ LOOP COMPLETO — ${state.cycle} ciclos executados.`);
    console.log(`   Entregar: commits + STATE.md + relatório.`);
    state.status = 'complete';
    saveState(feature, state);
    return;
  }

  if (isCycleComplete && newCycle) {
    console.log(`🔄 Ciclo ${state.cycle} completo. Iniciando ciclo ${newCycle}.`);
    state.cycle = newCycle;
    state.circuitBreakers.cyclesWithoutProgress++;
  }

  // Transition
  transition(state, next);
  saveState(feature, state);

  const taskCount = Object.keys(state.tasks).length;
  const phaseInstructions = {
    spec: `Criar spec.md em .specs/features/${feature}/spec.md`,
    design: `Criar design.md em .specs/features/${feature}/design.md`,
    tasks: `Criar tasks.md em .specs/features/${feature}/tasks.md`,
    implement: `Implementar tasks do tasks.md com commits atômicos`,
    test: `Executar gates de teste + validação`,
    heal: `Diagnosticar e reparar falhas do gate anterior`,
    deliver: `Commit final + atualizar STATE.md + relatório`,
  };

  console.log(`\n▶ FASE: ${next.toUpperCase()} (ciclo ${state.cycle})`);
  console.log(`  ${phaseInstructions[next]}`);
  console.log(`  Budget restante: ${state.budgetLimit.tokens - state.budgetUsed.tokens} tokens`);
}

function cmdHeal(taskId, feature) {
  const state = loadState(feature);
  if (!state) {
    console.log(`❌ Nenhum loop encontrado para "${feature}".`);
    return;
  }

  const taskFailures = state.circuitBreakers.taskFailures[taskId] || 0;
  const maxHeal = state.config.maxHealAttempts;

  if (taskFailures >= maxHeal) {
    console.log(`🛑 Tarefa ${taskId} bloqueada — ${taskFailures}/${maxHeal} tentativas de healing.`);
    console.log(`   Escalar para operador.`);
    state.tasks[taskId] = { ...state.tasks[taskId], status: 'blocked' };
    saveState(feature, state);
    return;
  }

  console.log(`🔧 Healing tarefa ${taskId} — tentativa ${taskFailures + 1}/${maxHeal}`);
  console.log(`   Diagnosticar → Reparar → Re-verificar`);

  // Register healing attempt
  state.healingLog.push({
    taskId,
    cycle: state.cycle,
    attempt: taskFailures + 1,
    timestamp: new Date().toISOString(),
    status: 'pending',
  });

  state.circuitBreakers.taskFailures[taskId] = taskFailures + 1;
  saveState(feature, state);
}

function cmdCheck(feature) {
  const state = loadState(feature);
  if (!state) {
    console.log(`❌ Nenhum loop encontrado para "${feature}".`);
    return;
  }

  const harness = checkHarness(state);
  console.log(`\n═══ Harness Check: ${state.feature} ═══`);
  console.log(`Action:  ${harness.action}`);
  console.log(`Reason:  ${harness.reason}`);
  console.log(`Detail:  ${harness.detail || 'N/A'}`);
  console.log(`\nBudget:`);
  console.log(`  Tokens: ${state.budgetUsed.tokens}/${state.budgetLimit.tokens} (${Math.round(state.budgetUsed.tokens / state.budgetLimit.tokens * 100)}%)`);
  const elapsed = Date.now() - new Date(state.startTime).getTime();
  console.log(`  Tempo:  ${Math.round(elapsed / 1000)}s/${Math.round(state.budgetLimit.time / 1000)}s (${Math.round(elapsed / state.budgetLimit.time * 100)}%)`);
  console.log(`\nCircuit Breakers:`);
  console.log(`  Consecutivas:  ${state.circuitBreakers.consecutiveFailures}/${CIRCUIT_BREAKERS.maxConsecutiveFailures}`);
  console.log(`  Sem progresso: ${state.circuitBreakers.cyclesWithoutProgress}/${CIRCUIT_BREAKERS.maxCyclesWithoutProgress}`);
  console.log(`  Scope creep:   ${state.circuitBreakers.scopeDivergence}/${CIRCUIT_BREAKERS.maxScopeDivergence}`);
}

function cmdPause(feature) {
  const state = loadState(feature);
  if (!state) {
    console.log(`❌ Nenhum loop encontrado para "${feature}".`);
    return;
  }

  state.status = 'paused';
  saveState(feature, state);

  console.log(`⏸  Loop pausado para "${feature}".`);
  console.log(`   Fase: ${state.phase} | Ciclo: ${state.cycle}`);
  console.log(`   Retomar com: node orchestrator.mjs resume ${feature}`);
}

function cmdResume(feature) {
  const state = loadState(feature);
  if (!state) {
    console.log(`❌ Nenhum loop encontrado para "${feature}".`);
    return;
  }

  if (state.status !== 'paused') {
    console.log(`⚠️  Loop não está pausado. Status: ${state.status}`);
    return;
  }

  state.status = 'running';
  saveState(feature, state);

  console.log(`▶  Loop retomado para "${feature}".`);
  console.log(`   Fase: ${state.phase} | Ciclo: ${state.cycle}`);
  console.log(`   Próxima ação: node orchestrator.mjs next ${feature}`);
}

function cmdReport(feature) {
  const state = loadState(feature);
  if (!state) {
    console.log(`❌ Nenhum loop encontrado para "${feature}".`);
    return;
  }

  const elapsed = Math.round((Date.now() - new Date(state.startTime).getTime()) / 1000);
  const tasks = Object.values(state.tasks);
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const blockedTasks = tasks.filter(t => t.status === 'blocked').length;

  console.log(`\n# Relatório de Loop — ${state.feature}`);
  console.log(`\n**Data:** ${new Date().toISOString()}`);
  console.log(`**Status:** ${state.status}`);
  console.log(`**Escopo:** ${state.scope}`);
  console.log(`**Ciclos:** ${state.cycle}/${state.config.maxCycles}`);
  console.log(`**Tempo total:** ${elapsed}s`);
  console.log(`**Budget usado:** ${state.budgetUsed.tokens}/${state.budgetLimit.tokens} tokens`);
  console.log(`\n## Tasks`);
  console.log(`| Task | Status | Heal Attempts |`);
  console.log(`|------|--------|---------------|`);
  for (const [id, task] of Object.entries(state.tasks)) {
    console.log(`| ${id} | ${task.status} | ${task.healAttempts || 0} |`);
  }
  console.log(`\n## Transições`);
  for (const t of state.transitions) {
    console.log(`- [Ciclo ${t.cycle}] ${t.from} → ${t.to} (${t.gateResult}) — ${t.timestamp}`);
  }
  if (state.healingLog.length > 0) {
    console.log(`\n## Healing Log`);
    for (const h of state.healingLog) {
      console.log(`- ${h.taskId} ciclo ${h.cycle} attempt ${h.attempt} — ${h.status || 'pending'}`);
    }
  }
  console.log(`\n## Para registrar`);
  console.log(`**Contexto:** Loop SDD executado para ${state.feature}`);
  console.log(`**Decisão:** ${state.status === 'complete' ? 'Concluído' : 'Pausado/Interrompido'}`);
  console.log(`**Justificativa:** Pipeline ${state.scope} com ${state.cycle} ciclos`);
  console.log(`**Trade-offs:** ${blockedTasks} tasks bloqueadas, ${state.healingLog.length} healings`);
}

// ─── Commands: ROADMAP Batch ──────────────────────────────────────────────────

function cmdRoadmap(roadmapPath) {
  const path = findRoadmapFile(roadmapPath);
  if (!path) {
    console.log(`❌ ROADMAP.md não encontrado.`);
    console.log(`   Procurado em:`);
    console.log(`   - .specs/project/ROADMAP.md`);
    console.log(`   - .specs/ROADMAP.md`);
    console.log(`   - ./ROADMAP.md`);
    console.log(`\n   Criar com: cerebro-kernel "initialize project" ou "roadmap"`);
    return;
  }

  const roadmap = parseRoadmap(path);

  console.log(`\n═══ ROADMAP: ${path} ═══`);
  console.log(`Total: ${roadmap.total} features | Feitas: ${roadmap.done} | Pendentes: ${roadmap.pending}`);
  console.log(`\nFeatures:`);

  let lastMilestone = null;
  let lastSection = null;

  for (const feature of roadmap.features) {
    // Print milestone header if changed
    if (feature.milestone !== lastMilestone) {
      console.log(`\n  ── ${feature.milestone || 'Sem milestone'} ──`);
      lastMilestone = feature.milestone;
      lastSection = null;
    }

    // Print section header if changed
    if (feature.section !== lastSection) {
      console.log(`    ${feature.section || ''}`);
      lastSection = feature.section;
    }

    // Check loop status
    const state = loadState(feature.slug);
    let statusIcon = '○'; // not started
    let statusText = 'não iniciado';

    if (feature.done) {
      statusIcon = '✓';
      statusText = 'concluído (roadmap)';
    } else if (state) {
      if (state.status === 'complete') {
        statusIcon = '✓';
        statusText = 'concluído (loop)';
      } else if (state.status === 'running') {
        statusIcon = '▶';
        statusText = `${state.phase} ciclo ${state.cycle}`;
      } else if (state.status === 'paused') {
        statusIcon = '⏸';
        statusText = `pausado em ${state.phase}`;
      }
    }

    const priorityTag = feature.priority === 'high' ? ' [ALTA]' : 
                        feature.priority === 'low' ? ' [baixa]' : '';
    const scopeTag = feature.scope ? ` (${feature.scope})` : '';

    console.log(`    ${statusIcon} ${feature.name}${scopeTag}${priorityTag} — ${statusText}`);
  }

  console.log(`\nPara rodar: node orchestrator.mjs roadmap-run ${path}`);
  console.log(`Status:    node orchestrator.mjs roadmap-status ${path}`);
}

function cmdRoadmapRun(roadmapPath, defaultScope = 'large') {
  const path = findRoadmapFile(roadmapPath);
  if (!path) {
    console.log(`❌ ROADMAP.md não encontrado.`);
    return;
  }

  const roadmap = parseRoadmap(path);
  const pending = roadmap.features.filter(f => !f.done);

  if (pending.length === 0) {
    console.log(`✅ Todas as features do ROADMAP já estão concluídas.`);
    return;
  }

  console.log(`\n═══ ROADMAP BATCH RUN ═══`);
  console.log(`Roadmap: ${path}`);
  console.log(`Features pendentes: ${pending.length}/${roadmap.total}`);
  console.log(`Scope default: ${defaultScope}`);
  console.log(`\nFila:`);

  for (let i = 0; i < pending.length; i++) {
    const f = pending[i];
    const scope = f.scope || defaultScope;
    const state = loadState(f.slug);
    const hasLoop = state && (state.status === 'running' || state.status === 'paused');
    console.log(`  ${i + 1}. ${f.name} [${scope}]${hasLoop ? ' (loop existe)' : ''}`);
  }

  console.log(`\n─── Iniciando batch ───`);

  const results = [];

  for (let i = 0; i < pending.length; i++) {
    const feature = pending[i];
    const scope = feature.scope || defaultScope;

    console.log(`\n━━━ [${i + 1}/${pending.length}] ${feature.name} ━━━`);

    // Check if loop already exists and is resumable
    const existingState = loadState(feature.slug);
    if (existingState && (existingState.status === 'running' || existingState.status === 'paused')) {
      console.log(`  ↻ Loop existente detectado — fase ${existingState.phase} ciclo ${existingState.cycle}`);
      console.log(`  Retomar com: node orchestrator.mjs resume ${feature.slug}`);
      console.log(`  Ou recomeçar: node orchestrator.mjs init ${feature.slug} ${scope} --force`);
      results.push({ feature: feature.name, slug: feature.slug, status: 'skipped', reason: 'loop exists' });
      continue;
    }

    // Initialize loop for this feature
    const state = createState(feature.slug, scope);
    saveState(feature.slug, state);

    const config = SCOPE_CONFIG[scope];
    console.log(`  ✓ Inicializado: ${scope} | ${PHASE_ORDER[scope].join(' → ')} | ${config.maxCycles} ciclos max`);

    // Log the first phase to execute (don't transition yet — agente executes current phase)
    const phaseLabels = {
      spec: 'SPEC',
      design: 'DESIGN',
      tasks: 'TASKS',
      implement: 'IMPLEMENT',
      test: 'TEST',
      heal: 'HEAL',
      deliver: 'DELIVER',
    };

    const currentState = loadState(feature.slug);
    console.log(`  ▶ Fase atual: ${phaseLabels[currentState.phase]} (ciclo ${currentState.cycle})`);
    console.log(`     Agente executa esta fase, depois: node orchestrator.mjs next ${feature.slug}`);
    console.log(`     Ou rodar batch com: node orchestrator.mjs roadmap-run ${path}`);

    results.push({ feature: feature.name, slug: feature.slug, status: 'initialized', phase: currentState.phase });
  }

  // Summary
  console.log(`\n━━━ RESUMO DO BATCH ━━━`);
  const completed = results.filter(r => r.status === 'complete').length;
  const paused = results.filter(r => r.status === 'paused').length;
  const skipped = results.filter(r => r.status === 'skipped').length;

  for (const r of results) {
    const icon = r.status === 'complete' ? '✓' : r.status === 'paused' ? '⏸' : '⏭';
    const detail = r.status === 'complete' ? `${r.cycles} ciclos` : r.reason;
    console.log(`  ${icon} ${r.feature} — ${r.status} (${detail})`);
  }

  console.log(`\n  Completas: ${completed} | Pausadas: ${paused} | Puladas: ${skipped}`);
  
  if (paused > 0) {
    console.log(`\n  Para continuar o batch:`);
    console.log(`  node orchestrator.mjs roadmap-run ${path}`);
  }
}

function cmdRoadmapStatus(roadmapPath) {
  const path = findRoadmapFile(roadmapPath);
  if (!path) {
    console.log(`❌ ROADMAP.md não encontrado.`);
    return;
  }

  const roadmap = parseRoadmap(path);

  console.log(`\n═══ ROADMAP STATUS: ${path} ═══`);
  console.log(`Total: ${roadmap.total} | Feitas: ${roadmap.done} | Pendentes: ${roadmap.pending}`);

  // Progress bar
  const progress = roadmap.total > 0 ? Math.round(roadmap.done / roadmap.total * 100) : 0;
  const barLength = 30;
  const filled = Math.round(roadmap.done / roadmap.total * barLength);
  const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
  console.log(`\n  [${bar}] ${progress}%`);

  // Feature details
  console.log(`\n  Feature                  | Scope    | Loop Status       | Priority`);
  console.log(`  ─────────────────────────┼──────────┼───────────────────┼─────────`);

  for (const feature of roadmap.features) {
    const state = loadState(feature.slug);
    let loopStatus = '—';
    let loopPhase = '';

    if (feature.done) {
      loopStatus = '✓ roadmap';
    } else if (state) {
      if (state.status === 'complete') {
        loopStatus = '✓ loop';
      } else if (state.status === 'running') {
        loopStatus = '▶ running';
        loopPhase = `${state.phase} C${state.cycle}`;
      } else if (state.status === 'paused') {
        loopStatus = '⏸ paused';
        loopPhase = state.phase;
      }
    }

    const name = feature.name.substring(0, 24).padEnd(24);
    const scope = (feature.scope || '—').padEnd(8);
    const status = (loopStatus + (loopPhase ? ` ${loopPhase}` : '')).padEnd(17);
    const priority = feature.priority === 'high' ? 'ALTA' : feature.priority === 'low' ? 'baixa' : 'média';

    console.log(`  ${name} | ${scope} | ${status} | ${priority}`);
  }

  // Loops ativos
  const activeLoops = roadmap.features
    .filter(f => !f.done)
    .map(f => loadState(f.slug))
    .filter(s => s && s.status === 'running');

  if (activeLoops.length > 0) {
    console.log(`\n  Loops ativos: ${activeLoops.length}`);
    for (const s of activeLoops) {
      console.log(`    ${s.feature}: ${s.phase} ciclo ${s.cycle}/${s.config.maxCycles}`);
    }
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

const [,, command, ...rawArgs] = process.argv;

// Parse flags
function extractFlags(args) {
  const flags = {};
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--scope' && args[i + 1]) {
      flags.scope = args[i + 1];
      i++;
    } else if (args[i].startsWith('--')) {
      flags[args[i].slice(2)] = true;
    } else {
      positional.push(args[i]);
    }
  }
  return { flags, positional };
}

const { flags, positional } = extractFlags(rawArgs);

switch (command) {
  case 'init': {
    const feature = positional[0];
    const scope = flags.scope || positional[1] || 'large';
    if (!feature) {
      console.log('Uso: node orchestrator.mjs init <feature-name> [scope]');
      console.log('Scopes: medium, large, complex');
      process.exit(1);
    }
    cmdInit(feature, scope);
    break;
  }

  case 'status': {
    const feature = positional[0];
    if (!feature) {
      console.log('Uso: node orchestrator.mjs status <feature-name>');
      process.exit(1);
    }
    cmdStatus(feature);
    break;
  }

  case 'next': {
    const feature = positional[0];
    if (!feature) {
      console.log('Uso: node orchestrator.mjs next <feature-name>');
      process.exit(1);
    }
    cmdNext(feature);
    break;
  }

  case 'heal': {
    const taskId = positional[0];
    const feature = positional[1];
    if (!taskId || !feature) {
      console.log('Uso: node orchestrator.mjs heal <task-id> <feature-name>');
      process.exit(1);
    }
    cmdHeal(taskId, feature);
    break;
  }

  case 'check': {
    const feature = positional[0];
    if (!feature) {
      console.log('Uso: node orchestrator.mjs check <feature-name>');
      process.exit(1);
    }
    cmdCheck(feature);
    break;
  }

  case 'pause': {
    const feature = positional[0];
    if (!feature) {
      console.log('Uso: node orchestrator.mjs pause <feature-name>');
      process.exit(1);
    }
    cmdPause(feature);
    break;
  }

  case 'resume': {
    const feature = positional[0];
    if (!feature) {
      console.log('Uso: node orchestrator.mjs resume <feature-name>');
      process.exit(1);
    }
    cmdResume(feature);
    break;
  }

  case 'report': {
    const feature = positional[0];
    if (!feature) {
      console.log('Uso: node orchestrator.mjs report <feature-name>');
      process.exit(1);
    }
    cmdReport(feature);
    break;
  }

  case 'roadmap': {
    cmdRoadmap(positional[0]);
    break;
  }

  case 'roadmap-run': {
    const scope = flags.scope || 'large';
    cmdRoadmapRun(positional[0], scope);
    break;
  }

  case 'roadmap-status': {
    cmdRoadmapStatus(positional[0]);
    break;
  }

  default:
    console.log(`
Cerebro Loop — Orchestrator

Comandos single-feature:
  init <feature> [scope]     Inicializar loop (scope: medium/large/complex)
  status <feature>           Ver status do loop
  next <feature>             Avançar para próxima fase
  heal <task-id> <feature>   Iniciar healing de uma tarefa
  check <feature>            Verificar harness (budget + circuit breakers)
  pause <feature>            Pausar loop
  resume <feature>           Retomar loop pausado
  report <feature>           Gerar relatório completo

Comandos ROADMAP batch:
  roadmap [path]             Listar features do ROADMAP com status
  roadmap-run [path]         Rodar features pendentes via loop (--scope <scope>)
  roadmap-status [path]      Dashboard de progresso do ROADMAP

Flags:
  --scope <scope>            Scope default para features sem scope definido

Exemplos:
  node orchestrator.mjs init fiscalizacao complex
  node orchestrator.mjs roadmap .specs/project/ROADMAP.md
  node orchestrator.mjs roadmap-run --scope large
  node orchestrator.mjs roadmap-status
`);
}
