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
    const features = picks.map((p) => {
      const isChain = !!p.chainSlug;
      const escapedName = p.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      const escapedCuisine = p.item.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `{"type":"Feature","geometry":{"type":"Point","coordinates":[${p.lng},${p.lat}]},"properties":{"name":"${escapedName}","cuisine":"${escapedCuisine}","isChain":${isChain}}}`;
    }).join(",");

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

map.on('load',function(){
  map.addSource('restaurants',{
    type:'geojson',
    data:{type:'FeatureCollection',features:[${features}]},
    cluster:true,
    clusterMaxZoom:15,
    clusterRadius:40
  });

  map.addLayer({
    id:'clusters',type:'circle',source:'restaurants',filter:['has','point_count'],
    paint:{
      'circle-color':'#4A7C59',
      'circle-radius':['step',['get','point_count'],16,5,22,10,28],
      'circle-stroke-width':2.5,'circle-stroke-color':'#fff',
      'circle-opacity':0.9
    }
  });
  map.addLayer({
    id:'cluster-count',type:'symbol',source:'restaurants',filter:['has','point_count'],
    layout:{'text-field':['get','point_count_abbreviated'],'text-size':11},
    paint:{'text-color':'#ffffff'}
  });

  map.addLayer({
    id:'unclustered-point',type:'circle',source:'restaurants',filter:['!',['has','point_count']],
    paint:{
      'circle-color':['case',['get','isChain'],'#4A7C59','#ffffff'],
      'circle-radius':12,
      'circle-stroke-width':2.5,'circle-stroke-color':'#fff',
      'circle-opacity':0.95
    }
  });
  map.addLayer({
    id:'unclustered-label',type:'symbol',source:'restaurants',filter:['!',['has','point_count']],
    layout:{'text-field':['slice',['get','name'],0,1],'text-size':11,'text-font':['DIN Pro Bold','Arial Unicode MS Bold']},
    paint:{'text-color':['case',['get','isChain'],'#ffffff','#374151']}
  });

  map.on('click','clusters',function(e){
    var f=map.queryRenderedFeatures(e.point,{layers:['clusters']})[0];
    map.getSource('restaurants').getClusterExpansionZoom(f.properties.cluster_id,function(err,z){
      if(!err)map.easeTo({center:f.geometry.coordinates,zoom:z});
    });
  });
  map.on('click','unclustered-point',function(e){
    var f=e.features[0];var p=f.properties;
    new mapboxgl.Popup({offset:16,closeButton:false,maxWidth:'200px'})
      .setLngLat(f.geometry.coordinates)
      .setHTML('<b style="font-size:12px">'+p.name+'</b><br><span style="font-size:10px;color:#666">'+p.cuisine+'</span>')
      .addTo(map);
  });
  map.on('mouseenter','clusters',function(){map.getCanvas().style.cursor='pointer'});
  map.on('mouseleave','clusters',function(){map.getCanvas().style.cursor=''});
});

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
