import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import { colors, fonts, radius } from "../theme/tokens";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? Constants.expoConfig?.extra?.MAPBOX_TOKEN ?? "";

interface MapPick {
  name: string;
  item: string;
  cal: number;
  lat: number;
  lng: number;
  chainSlug?: string | null;
}

interface Props {
  userLat: number;
  userLng: number;
  picks: MapPick[];
  delay?: number;
}

export function EatSmartMap({ userLat, userLng, picks, delay = 800 }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const html = useMemo(() => {
    const markersJs = picks
      .map((p) => {
        const isChain = !!p.chainSlug;
        const bg = isChain ? "#4A7C59" : "#ffffff";
        const fg = isChain ? "white" : "#374151";
        const escapedName = p.name.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        const escapedCuisine = p.item.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        return `addPin(map,[${p.lng},${p.lat}],'${escapedName}','${escapedCuisine}','${bg}','${fg}',${isChain});`;
      })
      .join("\n");

    const boundsJs = picks.map((p) => `bounds.extend([${p.lng},${p.lat}]);`).join("\n");

    return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"><\/script>
<link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet"/>
<style>
  *{margin:0;padding:0}
  body,html{height:100%;overflow:hidden}
  #map{width:100%;height:100%}
  .mapboxgl-ctrl-attrib{font-size:8px!important;opacity:0.4}
  .mapboxgl-popup-content{border-radius:10px;padding:8px 10px;font-family:system-ui,-apple-system,sans-serif}
</style></head><body>
<div id="map"></div>
<script>
try{
mapboxgl.accessToken='${MAPBOX_TOKEN}';

function addPin(map,lnglat,name,cuisine,bg,fg,isChain){
  var w=document.createElement('div');
  w.style.cssText='display:flex;flex-direction:column;align-items:center';
  var c=document.createElement('div');
  c.style.cssText='width:'+(isChain?34:28)+'px;height:'+(isChain?34:28)+'px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:'+(isChain?14:12)+'px;font-weight:700;border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,.25);background:'+bg+';color:'+fg;
  c.textContent=name.charAt(0);
  var t=document.createElement('div');
  t.style.cssText='width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid '+bg+';margin-top:-1px';
  w.appendChild(c);w.appendChild(t);

  new mapboxgl.Marker({element:w,anchor:'bottom'})
    .setLngLat(lnglat)
    .setPopup(new mapboxgl.Popup({offset:16,closeButton:false,maxWidth:'200px'})
      .setHTML('<b style="font-size:12px">'+name+'</b><br><span style="font-size:10px;color:#666">'+cuisine+'</span>'))
    .addTo(map);
}

var map=new mapboxgl.Map({
  container:'map',
  style:'mapbox://styles/mapbox/light-v11',
  center:[${userLng},${userLat}],
  zoom:15,
  attributionControl:false,
  minZoom:12,maxZoom:18
});
map.addControl(new mapboxgl.AttributionControl({compact:true}),'bottom-right');

var userEl=document.createElement('div');
userEl.style.cssText='width:14px;height:14px;border-radius:50%;background:#5b9cf5;border:3px solid white;box-shadow:0 0 0 2px #5b9cf5,0 2px 8px rgba(0,0,0,.3)';
new mapboxgl.Marker({element:userEl}).setLngLat([${userLng},${userLat}]).addTo(map);

${markersJs}

var bounds=new mapboxgl.LngLatBounds();
bounds.extend([${userLng},${userLat}]);
${boundsJs}
map.fitBounds(bounds,{padding:40,maxZoom:16});
}catch(e){
  window.ReactNativeWebView.postMessage('MAP_ERROR:'+e.message);
}
<\/script></body></html>`;
  }, [userLat, userLng, picks]);

  if (error) {
    return (
      <View style={[styles.container, styles.fallback]}>
        <Text style={styles.fallbackText}>Map unavailable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!ready ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.accentSage} />
          <Text style={styles.loadingText}>Loading map…</Text>
        </View>
      ) : (
        <WebView
          source={{ html }}
          style={styles.map}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={["*"]}
          onError={() => setError(true)}
          onHttpError={() => setError(true)}
          onMessage={(e) => {
            if (e.nativeEvent.data?.startsWith("MAP_ERROR:")) {
              console.warn("[EatSmartMap]", e.nativeEvent.data);
              setError(true);
            }
          }}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="small" color={colors.accentSage} />
            </View>
          )}
          startInLoadingState
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 220,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  map: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceWarm,
  },
  loadingText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
    marginTop: 6,
  },
  fallback: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceWarm,
  },
  fallbackText: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: `${fonts.body}_400Regular`,
  },
});
