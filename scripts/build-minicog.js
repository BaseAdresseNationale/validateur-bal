#!/usr/bin/env node
const path = require('path');
const process = require('process');
const { outputJson } = require('fs-extra');
const communes = require('@etalab/decoupage-administratif/data/communes.json');

const PLM = new Set(['75056', '69123', '13055']);

async function main() {
  const communesActuelles = communes
    .filter(
      (c) =>
        ['commune-actuelle', 'arrondissement-municipal'].includes(c.type) &&
        !PLM.has(c.code),
    )
    .map((c) => ({ code: c.code, nom: c.nom, anciensCodes: c.anciensCodes }));

  await outputJson(
    path.join(__dirname, '..', 'minicog.json'),
    communesActuelles,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
