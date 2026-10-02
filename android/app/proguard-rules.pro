# Add project specific ProGuard rules here.
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# --- WatermelonDB JSI ---
# JSIInstaller._resolveDatabasePath y provideSyncJson se invocan desde C++/JNI,
# por lo que R8 no puede ver las referencias y las eliminaría en release.
-keep class com.nozbe.watermelondb.** { *; }
-keep class com.nozbe.watermelondb.jsi.** { *; }
-keepclassmembers class com.nozbe.watermelondb.** { *; }
-dontwarn com.nozbe.watermelondb.**

# --- Android Widget ---
-keep class com.reactnativeandroidwidget.** { *; }
-keep class com.docash.widget.** { *; }

# --- react-native-sound ---
-keep class com.zmxv.RNSound.** { *; }
-keep class com.facebook.react.modules.vibration.** { *; }

