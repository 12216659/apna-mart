const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withDevelopmentCleartext(appConfig) {
  return withAndroidManifest(appConfig, (modConfig) => {
    const application = modConfig.modResults.manifest.application?.[0];
    if (!application) {
      throw new Error("Android application node is missing from the manifest.");
    }

    if (process.env.NODE_ENV === "production") {
      delete application.$["android:usesCleartextTraffic"];
    } else {
      application.$["android:usesCleartextTraffic"] = "true";
    }

    return modConfig;
  });
};
