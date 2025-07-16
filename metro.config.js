const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

// 1. Get default Expo Metro config
const defaultConfig = getDefaultConfig(__dirname);

// 2. Enable Firebase support
defaultConfig.resolver.sourceExts.push("cjs");
defaultConfig.resolver.unstable_enablePackageExports = false;

// 3. Add NativeWind support (Tailwind CSS)
const nativeWindConfig = withNativeWind(defaultConfig, {
  input: "./global.css", // Make sure this file exists
});

// 4. Export the combined config
module.exports = nativeWindConfig;
