This project requires the most recent version of Firefox or Chrome
with native openGL enabled (by disabling ANGLE)

In firefox set "webgl.prefer-native-gl" to true in about:config

In chrome, modify a shortcut to start with the flags "--allow-file-access-from-files --use-angle=gl"
(The first flag is to disable CORS so resources can be retreived via ajax)