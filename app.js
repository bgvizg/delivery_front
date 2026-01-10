const API_BASE = "https://remains-counting-say-perception.trycloudflare.com";

let map;
let markers = [];
let infoWindow = null;

async function loadAreas() {
  const res = await fetch(`${API_BASE}/areas`);
  const areas = await res.json();

  const select = document.getElementById("areaSelect");
  select.innerHTML = "";

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

    const position = new kakao.maps.LatLng(lat, lon);

    const marker = new kakao.maps.Marker({
      position,
      map,
    });

    const content = `
      <div style="padding:8px;font-size:13px;">
        <b>순위:</b> ${rank}<br/>
        <b>주소:</b> ${addr}<br/>
        <b>메모:</b> ${memo}
      </div>
    `;

    kakao.maps.event.addListener(marker, "click", () => {
      if (infoWindow) infoWindow.close();

      infoWindow = new kakao.maps.InfoWindow({
        content,
      });

      infoWindow.open(map, marker);
    });

    markers.push(marker);
  });
}

function clearMarkers() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
}

function initMap() {
  const container = document.getElementById("map");

  const options = {
    center: new kakao.maps.LatLng(37.5665, 126.978),
    level: 5,
  };

  map = new kakao.maps.Map(container, options);

  loadAreas();
}

/* ⭐ 핵심: SDK 로드 완료 후 실행 */
kakao.maps.load(initMap);
