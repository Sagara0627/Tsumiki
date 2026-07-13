const { withEntitlementsPlist } = require('expo/config-plugins');

// expo-notifications is autolinked and always adds `aps-environment`, which
// requires the Push Notifications capability. This app only schedules local
// notifications, and free Apple Developer accounts can't provision that
// capability, so strip it back out after expo-notifications runs.
module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (config) => {
    delete config.modResults['aps-environment'];
    return config;
  });
};
