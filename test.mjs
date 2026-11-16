import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const source = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), 'dist/game.js'), 'utf8');

test('the distribution contains all required game files', () => {
  const root = dirname(fileURLToPath(import.meta.url));
  for (const filename of ['index.html', 'game.js', 'styles.css', 'overrides.css']) {
    assert.ok(statSync(resolve(root, 'dist', filename)).size > 0, `${filename} should not be empty`);
  }
});

// Tiny DOM + canvas simulator. It exercises actual game input and shop code
// without installing a browser or a third-party test framework.
function bootGame() {
  const listeners = new Map();
  const noop = () => {};
  const gradient = () => ({ addColorStop: noop });
  const context = {
    fillRect: noop, strokeRect: noop, clearRect: noop, drawImage: noop,
    beginPath: noop, closePath: noop, arc: noop, ellipse: noop, stroke: noop,
    fill: noop, moveTo: noop, lineTo: noop, translate: noop, rotate: noop,
    save: noop, restore: noop, fillText: noop, createLinearGradient: gradient,
    createRadialGradient: gradient
  };

  class MockElement {
    constructor(id) {
      this.id = id;
      this.style = {};
      this.innerHTML = '';
      this.textContent = '';
      this.width = 176;
      this.height = 176;
      this.handlers = new Map();
      this.classes = new Set(id === 'startScreen' ? ['visible'] : []);
      this.classList = {
        add: name => this.classes.add(name),
        remove: name => this.classes.delete(name),
        contains: name => this.classes.has(name),
        toggle: (name, force) => {
          const enabled = force === undefined ? !this.classes.has(name) : force;
          enabled ? this.classes.add(name) : this.classes.delete(name);
          return enabled;
        }
      };
    }
    getContext() { return context; }
    addEventListener(type, fn) {
      if (!this.handlers.has(type)) this.handlers.set(type, []);
      this.handlers.get(type).push(fn);
    }
    dispatch(type, event = {}) {
      for (const handler of this.handlers.get(type) || []) handler(event);
    }
  }

  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) elements.set(id, new MockElement(id));
    return elements.get(id);
  };
  const tabs = ['weapons', 'upgrades', 'equipment'].map(id => {
    const tab = element(`tab-${id}`);
    tab.dataset = { tab: id };
    return tab;
  });
  const document = {
    pointerLockElement: null, hidden: false,
    getElementById: element,
    createElement: () => new MockElement('generated-canvas'),
    querySelectorAll: () => tabs,
    addEventListener: (type, fn) => {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(fn);
    },
    exitPointerLock: () => { document.pointerLockElement = null; emit('pointerlockchange'); }
  };
  function emit(type, event = {}) {
    for (const fn of listeners.get(type) || []) fn({ preventDefault: noop, repeat: false, ...event });
  }
  element('game').requestPointerLock = () => {
    document.pointerLockElement = element('game');
    emit('pointerlockchange');
    return Promise.resolve();
  };

  let nextFrame = null, time = 0;
  const stored = new Map();
  const sandbox = {
    document,
    window: { innerWidth: 1100, innerHeight: 760, addEventListener: noop },
    localStorage: { getItem: k => stored.get(k) ?? null, setItem: (k, v) => stored.set(k, v) },
    requestAnimationFrame: fn => { nextFrame = fn; },
    setTimeout: noop,
    console
  };
  vm.runInNewContext(source, sandbox, { filename: 'game.js', timeout: 5000 });

  return {
    element,
    click: id => element(id).dispatch('click'),
    key: code => emit('keydown', { code }),
    tick: (frames = 1) => {
      for (let n = 0; n < frames; n++) {
        const frame = nextFrame;
        assert.equal(typeof frame, 'function');
        time += 50;
        frame(time);
      }
    },
    buy: id => element('shopItems').dispatch('click', {
      target: { closest: () => ({ dataset: { buy: id }, disabled: false }) }
    })
  };
}

test('the game starts with wave one, five enemies and the starting loadout', () => {
  const game = bootGame();
  game.click('startBtn');
  game.tick(4);
  assert.equal(game.element('waveText').textContent, '01');
  assert.equal(game.element('enemyText').textContent, '05');
  assert.equal(game.element('creditText').textContent, '250');
  assert.equal(game.element('ammoValue').textContent, 12);
  assert.ok(!game.element('startScreen').classList.contains('visible'));
});

test('opening the armory pauses combat and buying damage deducts credits', () => {
  const game = bootGame();
  game.click('startBtn');
  game.tick(4);
  game.key('KeyB');
  assert.ok(game.element('shopScreen').classList.contains('visible'));
  game.element('tab-upgrades').dispatch('click');
  assert.match(game.element('shopItems').innerHTML, /AMPLIFIED ROUNDS/);
  game.buy('damage');
  assert.equal(game.element('shopCredits').textContent, '20');
  assert.match(game.element('shopItems').innerHTML, /LVL 1 \/ 5/);
  game.click('nextWaveBtn');
  assert.ok(!game.element('shopScreen').classList.contains('visible'));
});

test('a grenade is consumed and shooting uses magazine ammunition', () => {
  const game = bootGame();
  game.click('startBtn');
  game.tick(34);
  game.key('KeyG');
  game.tick(2);
  assert.equal(game.element('grenadeCount').textContent, '0 LEFT');
  game.element('game').dispatch('mousedown', { button: 0 });
  game.tick(2);
  game.element('game').dispatch('mouseup', { button: 0 });
  assert.ok(Number(game.element('ammoValue').textContent) < 12);
});
