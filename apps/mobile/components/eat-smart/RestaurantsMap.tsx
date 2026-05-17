import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { colors, fonts, radius } from "../../theme/tokens";

const MAPBOX_TOKEN =
  "MAPBOX_TOKEN_PLACEHOLDER";

function scoreColor(score: number): string {
  if (score >= 80) return "#4A7C59";
  if (score >= 60) return "#C4964A";
  return "#C45A4A";
}

export interface MapPin {
  id: string;
  lat: number;
  lng: number;
  score: number;
  name: string;
}

interface Props {
  pins: MapPin[];
  userLat: number;
  userLng: number;
  onPinPress?: (pin: MapPin) => void;
}

export function RestaurantsMap({ pins, userLat, userLng, onPinPress }: Props) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  const html = useMemo(() => {
    const markersJs = pins
      .map((p) => {
        const c = scoreColor(p.score);
        const escapedId = p.id.replace(/'/g, "\\'");
        return `addPin(map,[${p.lng},${p.lat}],'${escapedId}','${c}',${p.score});`;
      })
      .join("\n");

    const boundsJs = pins.map((p) => `bounds.extend([${p.lng},${p.lat}]);`).join("\n");

    return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script src="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js"><\/script>
<link href="https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css" rel="stylesheet"/>
<style>
  *{margin:0;padding:0}
  body,html{height:100%;overflow:hidden}
  #map{width:100%;height:100%}
  .mapboxgl-ctrl-attrib{font-size:8px!important;opacity:0.3}
  .pin{width:30px;height:30px;border-radius:15px;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3);cursor:pointer;transition:transform .15s}
  .pin:active{transform:scale(1.2)}
  .pin-score{font-size:10px;font-weight:800;color:#fff;line-height:1}
</style></head><body>
<div id="map"></div>
<script>
try{
mapboxgl.accessToken='${MAPBOX_TOKEN}';

function addPin(map,lnglat,id,bg,score){
  var el=document.createElement('div');
  el.className='pin';
  el.style.background=bg;
  el.innerHTML='<span class="pin-score">'+score+'</span>';
  el.addEventListener('click',function(){
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'pin',id:id}));
  });
  new mapboxgl.Marker({element:el,anchor:'center'})
    .setLngLat(lnglat)
    .addTo(map);
}

var map=new mapboxgl.Map({
  container:'map',
  style:'mapbox://styles/mapbox/light-v11',
  center:[${userLng},${userLat}],
  zoom:15,
  attributionControl:false,
  minZoom:12,maxZoom:18,
  dragRotate:false,
  pitchWithRotate:false
});
map.addControl(new mapboxgl.AttributionControl({compact:true}),'bottom-right');

var userEl=document.createElement('div');
userEl.style.cssText='width:14px;height:14px;border-radius:50%;background:#3B7CB8;border:3px solid white;box-shadow:0 0 0 2px #3B7CB8,0 2px 8px rgba(0,0,0,.3);animation:pulse 2s infinite';
var style=document.createElement('style');
style.textContent='@keyframes pulse{0%,100%{box-shadow:0 0 0 2px #3B7CB8,0 2px 8px rgba(0,0,0,.3)}50%{box-shadow:0 0 0 6px rgba(59,124,184,.3),0 2px 8px rgba(0,0,0,.3)}}';
document.head.appendChild(style);
new mapboxgl.Marker({element:userEl}).setLngLat([${userLng},${userLat}]).addTo(map);

${markersJs}

var bounds=new mapboxgl.LngLatBounds();
bounds.extend([${userLng},${userLat}]);
${boundsJs}
if(${pins.length}>0) map.fitBounds(bounds,{padding:40,maxZoom:16});
}catch(e){
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',msg:e.message}));
}
<\/script></body></html>`;
  }, [userLat, userLng, pins]);

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "pin" && onPinPress) {
        const pin = pins.find((p) => p.id === msg.id);
        if (pin) onPinPress(pin);
      }
      if (msg.type === "error") {
        setError(true);
      }
    } catch {}
  };

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
          onMessage={handleMessage}
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
    height: 200,
    borderRadius: radius.md,
    overflow: "hidden",
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
