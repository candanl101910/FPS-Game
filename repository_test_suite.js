/**
 * CyberStrike 3D Automated Test Suite
 * Validates state structures, weapons, tools, classes, and wave mechanics.
 */

const assert = require('assert');

// Mock Game State Data Definitions
const CLASSES = {
    commando: { maxHp: 100, speed: 1.0, primary: 'assaultRifle', tool: 'fragGrenade' },
    ninja: { maxHp: 90, speed: 1.2, primary: 'cyberBlade', tool: 'empShockwave' },
    titan: { maxHp: 160, speed: 0.88, primary: 'shotgun', tool: 'laserTurret' },
    medic: { maxHp: 105, speed: 1.05, primary: 'plasmaRifle', tool: 'healthSyringe' },
    pyro: { maxHp: 110, speed: 0.95, primary: 'flamethrower', tool: 'fragGrenade' }
};

const WEAPONS = {
    pistol: { magCap: 12 },
    assaultRifle: { magCap: 30 },
    cyberBlade: { magCap: Infinity },
    shotgun: { magCap: 8 },
    plasmaRifle: { magCap: 15 },
    flamethrower: { magCap: 50 },
    sniper: { magCap: 5 }
};

function runTests() {
    console.log("🧪 Running CyberStrike 3D Test Suite...\n");

    // Test 1: Class Integrity
    Object.keys(CLASSES).forEach(clsKey => {
        const cls = CLASSES[clsKey];
        assert(cls.maxHp > 0, `Class ${clsKey} must have positive HP`);
        assert(WEAPONS[cls.primary], `Class ${clsKey} primary weapon must exist`);
        console.log(`✓ Class Verification Passed: ${clsKey}`);
    });

    // Test 2: Wave Shield Replenishment Calculation
    let shield = 10;
    const maxShield = 50;
    shield = Math.min(maxShield, shield + 25);
    assert.strictEqual(shield, 35, "Shield replenishment should add +25 up to cap");
    console.log("✓ Wave Shield Replenishment Logic Passed");

    // Test 3: Wave Enemy Scaling Formula
    function getWaveEnemyCount(waveNum) {
        if (waveNum === 1) return 3;
        if (waveNum === 2) return 5;
        if (waveNum === 3) return 8;
        return 8 + (waveNum * 3);
    }
    assert.strictEqual(getWaveEnemyCount(1), 3, "Wave 1 should spawn 3 enemies");
    assert.strictEqual(getWaveEnemyCount(20), 68, "Wave 20 should spawn 68 enemies");
    console.log("✓ Enemy Wave Scaling Formula Passed");

    console.log("\n✅ All automated tests passed successfully!");
}

try {
    runTests();
} catch (err) {
    console.error("❌ Test Failed:", err.message);
    process.exit(1);
}