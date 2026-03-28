import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

function run(cmd) {
	try {
		return execSync(cmd, { encoding: 'utf8' }).trim();
	} catch {
		return '';
	}
}

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const currentVersion = manifest.version;

// Find the last version bump commit to use as the range start
const allLogs = run('git log --format="%H %s"').split('\n').filter(Boolean);
const lastBumpLine = allLogs.find((line) => line.includes('chore: bump version'));
const lastBumpHash = lastBumpLine ? lastBumpLine.split(' ')[0] : null;

// Get commit messages since the last bump (or all commits if first time)
const range = lastBumpHash ? `${lastBumpHash}..HEAD` : '';
const commitMessages = run(`git log ${range} --format="%s"`).split('\n').filter(Boolean);

if (commitMessages.length === 0) {
	console.log('No new commits since last version bump — skipping.');
	process.exit(0);
}

console.log(`Analysing ${commitMessages.length} commit(s):`);
commitMessages.forEach((m) => console.log(`  ${m}`));

// Determine bump type from conventional commits
// fix: → patch, feat: → minor, any breaking change → major
let bumpType = null;

for (const msg of commitMessages) {
	if (/^(\w+)(\(.+\))?!:/.test(msg) || msg.includes('BREAKING CHANGE')) {
		bumpType = 'major';
		break;
	}
	if (/^feat(\(.+\))?:/.test(msg) && bumpType !== 'major') {
		bumpType = 'minor';
	}
	if (/^fix(\(.+\))?:/.test(msg) && !bumpType) {
		bumpType = 'patch';
	}
}

if (!bumpType) {
	console.log('No version-bumping commits found (need feat:, fix:, or breaking change) — skipping.');
	process.exit(0);
}

// Calculate new version
const [major, minor, patch] = currentVersion.split('.').map(Number);
const newVersion =
	bumpType === 'major' ? `${major + 1}.0.0`
	: bumpType === 'minor' ? `${major}.${minor + 1}.0`
	: `${major}.${minor}.${patch + 1}`;

console.log(`\nBumping version: ${currentVersion} → ${newVersion} (${bumpType})`);

// Write updated versions
manifest.version = newVersion;
pkg.version = newVersion;

writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t') + '\n');
writeFileSync('package.json', JSON.stringify(pkg, null, '\t') + '\n');
