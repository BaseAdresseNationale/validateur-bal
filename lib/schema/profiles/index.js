const profiles = {
  default: require('./1.4'),
  relax: require('./1.4-relax'),
  1.4: require('./1.4'),
  '1.4-relax': require('./1.4-relax'),
  1.3: require('./1.3'),
  '1.3-relax': require('./1.3-relax'),
  '1.3-strict': require('./1.3-strict'),
  '1.2-strict': require('./1.2-strict'),
  '1.1-strict': require('./1.1-strict')
}

module.exports = profiles
