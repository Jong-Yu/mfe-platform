#!/usr/bin/env python3
"""Collect completed Vite walkthrough evidence without rerunning the product."""
from pathlib import Path
import hashlib
import json
import sys

root = Path(__file__).resolve().parents[2]
clone = '--clone' in sys.argv
cold = clone or '--cold' in sys.argv
out = root / ('docs/verification/vite-clone' if clone else 'docs/verification/vite-cold-install' if cold else 'docs/verification/vite-walkthrough')

def read(name):
    return json.loads((out / name).read_text())

dev = read('development/report.json')
release = read('release/report.json')
versions = read('versions/report.json')
parts = []
for name, record, report in [
    ('V5 development and error recovery', dev, 'development/report.json'),
    ('V6 B release, CLI/UI activation and rollback', release, 'release/report.json'),
]:
    parts.append({'name': name, 'checks': len(record['checks']),
                  'passed': sum(c['status'] == 'passed' for c in record['checks']),
                  'status': record['status'], 'report': report})
parts.append({'name': 'V7 SDK and D replacement and rollback',
              'checks': versions['totalChecks'], 'passed': versions['passedChecks'],
              'status': versions['status'], 'report': 'versions/report.json'})
assert all(p['status'] == 'passed' and p['checks'] == p['passed'] for p in parts)

findings = [
    {'id': 'dev-reload-condition',
     'observation': 'Removing only the invalid line restored the previous source and development composition; the overlay cleared while input, counter and cache remained. The reload comparison uses the development composition ID, not only the B artifact ID.',
     'change': 'V5 now distinguishes a changed development composition from an exact-source repair with unchanged settings and kit.',
     'evidence': 'development/report.json'},
    {'id': 'concrete-edit-and-reset',
     'observation': 'An unspecified title edit is hard to follow. Keeping the V5 edit through the V6 initial build would include the new title in the baseline.',
     'change': 'Added exact Car Picker before/after text, counter and memo values, and restoring the original source before the release lesson.',
     'evidence': 'development/report.json'},
    {'id': 'terminal-transition',
     'observation': 'V5 leaves a server running in the B folder while V6 starts at the repository root.',
     'change': 'Added Ctrl+C, cd ../.., and the roles of the server terminal and second terminal.',
     'evidence': 'release/report.json'},
    {'id': 'empty-store-start',
     'observation': 'Normal build initializes the supplied configuration in an empty store. Navigation and dashboard placements are initially absent.',
     'change': 'Clarified that bootstrap is not required for this starting state, and described the default screen and port override.',
     'evidence': 'release/report.json'},
    {'id': 'publish-is-not-activate',
     'observation': 'A new tab still loaded the old B after publication and before activation. A newly built B requires its own D binding.',
     'change': 'Added the pre-activation observation and emphasized choosing the new B and its D together.',
     'evidence': 'release/report.json'},
    {'id': 'rollback-shell-variable',
     'observation': 'The documented shell retains MFE_DEMO_PREVIOUS only in that shell. Reading current after activation returns the new composition.',
     'change': 'Added keeping the same terminal, printing the saved ID, and using that ID if the terminal was closed.',
     'evidence': 'release/report.json'},
]
if cold:
    findings = [
        {'id': 'first-install-prerequisites', 'observation': 'All three initial online installs succeeded from separately verified empty caches. npm downloaded public dependencies; Node and Chrome were already installed.',
         'change': 'Added Node/npm checks, initial internet access and normal browser prerequisites. Separated manual practice from automated Playwright setup.', 'evidence': 'development/report.json'},
        {'id': 'vendor-and-dev-kit', 'observation': 'The local build-tool tarball and published dev kit are required source deliverables. They contain no preinstalled node_modules and are not the npm cache.',
         'change': 'Clarified complete source snapshot requirements and missing vendor/dev file troubleshooting; did not claim fresh Git-clone validation.', 'evidence': 'development/report.json'},
        {'id': 'cache-modes', 'observation': 'The first installation must have network access. Later project installations and isolated SDK/D upgrades can reuse the cache created during that same run.',
         'change': 'Added a new temporary-cache recipe, distinct first-install and offline-test instructions, and cold replay commands that preserve existing caches.', 'evidence': 'versions/report.json'},
        {'id': 'dependency-installation', 'observation': 'Build tools are devDependencies and platform binaries are optional dependencies. The tested macOS install included both.',
         'change': 'Added guidance for production/omit settings and cold harnesses now remove inherited NODE_ENV for reproducibility. This small post-run harness hardening does not change the recorded successful run.', 'evidence': 'release/report.json'},
        {'id': 'no-blocking-failure', 'observation': 'The initial downloads, same-copy development, deployment, binding changes, old/new tabs and CLI/UI rollback all passed.',
         'change': 'Kept application code unchanged and recorded the exact installation and browser scope.', 'evidence': 'release/report.json'},
    ]
if clone:
    findings = [
        {'id': 'upstream-revision', 'observation': 'The actual GitHub clone is e4498f6 with Webpack build-tools 1.7.0 and the older learning book. The local Vite migration was not committed upstream.',
         'change': 'Added clone revision and pre-install checks, and kept upstream failure separate from the complete local candidate commit cloned for verification.', 'evidence': 'upstream.json'},
        {'id': 'uncommitted-deliverables', 'observation': 'Nine Vite build-tool tarballs and 174 development-kit files referenced by current manifests were present locally but absent from the original Git commit.',
         'change': 'Included the complete source, vendor and development-kit inputs in the temporary candidate commit. Added a no-install preflight that verifies lock integrity, kit checksums and exact HEAD file contents.', 'evidence': 'candidate-preflight.json'},
        {'id': 'node-selection', 'observation': 'The first clone shell selected Node 16.14.0 even though Node 24 was installed. Playwright and Vite could not run; the first attempt is preserved and is not counted as passing.',
         'change': 'Documented selecting Node in the current shell and each new terminal before preflight/npm. Retried with the already installed Node 24.22.1 and newly empty caches; Node installation itself was not tested.', 'evidence': 'first-attempt/failure.json'},
        {'id': 'missing-input-guard', 'observation': 'Missing or altered tarballs, kit files, .nvmrc and uncommitted inputs now produce explicit failures before npm installation.',
         'change': 'Added check-clone.cjs with --git/--root/--json and recorded normal and failure-case checks.', 'evidence': 'preflight-regression.json'},
    ]
(out / 'findings.json').write_text(json.dumps(findings, ensure_ascii=False, indent=2) + '\n')
summary = {
    'status': 'passed', 'date': '2026-11-10',
    'scope': 'Current working-tree copies without prior installations, build outputs or product stores. Actual Vite development, publication, activation and rollback; not a fresh Git clone, empty-cache network installation, full product suite or the historical 205 Webpack checks.',
    'environment': {'node': release['node'], 'chrome': release['browser'],
                    'platform': dev['environment']['platform'],
                    'installation': 'Prepared npm cache, offline npm ci/setup'},
    'parts': parts, 'checks': sum(p['checks'] for p in parts),
    'passed': sum(p['passed'] for p in parts),
    'originalPreserved': dev['originalUnchanged'] and dev['productPointerUnchanged']
                         and release['originalPreserved'] and versions['originalSourcesUnchanged']
                         and versions['baselineStorePointerUnchanged'],
    'findings': 'findings.json', 'productCodeChanged': False,
    'scripts': ['../../book/vite-dev-walkthrough.mjs',
                '../../book/vite-release-walkthrough.mjs',
                '../../book/vite-version-walkthrough.mjs'],
    'earlyAttempts': [{'report': 'release/first-pass-report.json',
                       'kind': 'verification harness assumption',
                       'explanation': 'The build succeeded. A harness assertion incorrectly distinguished omitted navigation from an empty navigation list; the assertion was corrected before a fresh complete run.'}],
    'updatedBookSHA256': hashlib.sha256((root / 'docs/mfe-self-study.html').read_bytes()).hexdigest(),
}
assert summary['originalPreserved']
if cold:
    empty = [dev['coldInstall']['immediatelyBeforeFirstNpm']['entries'],
             release['cacheBefore']['entries'], versions['installation']['cacheEntriesBeforeInstall']]
    assert empty == [[], [], []]
    cache_paths = [dev['environment']['cache'], release['npmCache'], versions['installation']['cache']]
    assert len(set(cache_paths)) == 3
    misses = {'development': dev['coldInstall']['downloadEvidence']['cacheMissDownloadCount'],
              'release': len(release['networkDownloads']), 'versions': versions['installation']['cacheMisses']}
    assert all(count > 0 for count in misses.values())
    summary.update({
        'scope': 'Three independent current-source copies and verified-empty private npm caches. Official-registry online initial downloads, then actual development, publication, CLI/UI activation, SDK/D replacement and rollback. Existing Node/Chrome on macOS; not a fresh Git clone, Node installation test, other-OS validation or the complete product test suite.',
        'cacheEvidence': {'paths': cache_paths, 'entriesBeforeFirstInstall': empty,
                          'officialRegistry': 'https://registry.npmjs.org/', 'cacheMissDownloads': misses},
        'earlyAttempts': [],
        'replayMode': ['MFE_WALKTHROUGH_COLD=1', 'MFE_RELEASE_COLD=1', 'MFE_VERSIONS_COLD=1'],
    })
    summary['environment']['installation'] = 'New empty private npm caches, online initial install, no inherited npm configuration; later installs reuse only the newly populated per-run cache'
if clone:
    candidate = read('candidate.json')
    preflight = read('candidate-preflight.json')
    after = read('candidate-after.json')
    assert preflight['status'] == 'passed'
    assert candidate['initialStatus'] == after['status'] == ''
    assert candidate['commit'] == after['commit'] == preflight['head']
    assert dev['sourceRepository'] == candidate['directory']
    assert release['input']['sourceRepository'] == candidate['directory']
    assert versions['sourceRepository'] == candidate['directory']
    summary.update({
        'status': 'local-candidate-passed',
        'recordType': 'historical-prepublication-validation',
        'scope': '45 passing checks apply only to the complete local candidate commit freshly git-cloned without an overlay or preinstalled active projects. Each suite copied inputs exclusively from that clone and started with a new empty npm cache. At verification time the actual GitHub clone was the older Webpack revision. This historical report does not describe the current remote HEAD or claim a new execution.',
        'upstream': read('upstream.json'),
        'candidate': candidate,
        'candidatePreserved': after,
        'preflight': 'candidate-preflight.json',
        'preflightRegression': 'preflight-regression.json',
        'earlyAttempts': [{'report': 'first-attempt/failure.json', 'kind': 'unsupported Node selected in a new shell'}],
        'publicationPendingAtVerification': True,
        'runtimeInstructionsUnchangedAfterExecution': after['runtimeInstructionsUnchanged'],
    })
    summary['environment']['npm'] = candidate['npm']
(out / 'report.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'checks': summary['checks'], 'passed': summary['passed'],
                  'originalPreserved': summary['originalPreserved']}))
