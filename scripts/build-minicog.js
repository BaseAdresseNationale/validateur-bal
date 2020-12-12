#!/usr/bin/env node
const path = require('path')
const {outputJson} = require('fs-extra')
const communes = require('@etalab/decoupage-administratif/data/communes.json')

const PLM = new Set(['75056', '69123', '13055'])

async function main() {
  const communesActuelles = communes
    .filter(c => ['commune-actuelle', 'arrondissement-municipal'].includes(c.type) && !PLM.has(c.code))
    .map(c => ({code: c.code, nom: c.nom}))

  const communesDelegueesAssociees = communes
    .filter(c => ['commune-associee', 'commune-deleguee'].includes(c.type))
    .map(c => ({code: c.code, nom: c.nom, chefLieu: c.chefLieu}))

  await outputJson(path.join(__dirname, '..', 'minicog.json'), [...communesActuelles, ...communesDelegueesAssociees])
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
