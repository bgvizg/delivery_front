const API_BASE = "http://1.244.175.117";

let map;
let markers = [];

async function loadAreas() {
  const res = await fetch(`${API_BASE}/areas`);
  const areas = await res.json();
  const select = document.getElementById("areaSelect");
  areas.forEach((a) => {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    select.appendChild(opt);
  });

  select.onchange = () => loadDeliveries(select.value);
  loadDeliveries(areas[0]);
}

async function loadDeliveries(area) {
  const res = await fetch(`${API_BASE}/deliveries?area=${area}`);
  const json = await res.json();

  clearMarkers();

  json.data.forEach((item) => {
    const [rank, addr, lat, lon, memo] = item;

    const marker = new naver.maps.Marker({
      position: new naver.maps.LatLng(lat, lon),
      map,
    });

    const info = new naver.maps.InfoWindow({
      content: `
        <div style="padding:8px">
          <b>순위:</b> ${rank}<br/>
          <b>주소:</b> ${addr}<br/>
          <b>메모:</b> ${memo}
        </div>
      `,
    });

    naver.maps.Event.addListener(marker, "click", () => {
      info.open(map, marker);
    });

    markers.push(marker);
  });
}

function clearMarkers() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
}

function initMap() {
  map = new naver.maps.Map("map", {
    center: new naver.maps.LatLng(37.5665, 126.978),
    zoom: 10,
  });

  loadAreas();
}

initMap();
