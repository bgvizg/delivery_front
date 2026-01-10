const API_BASE = "https://remains-counting-say-perception.trycloudflare.com";

let map;
let markers = [];
let infoWindow = null;

/* ================= 지도 초기화 ================= */
function initMap() {
  map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(37.5665, 126.978),
    level: 6,
  });

  loadAreas();
}

/* ================= 지역 목록 ================= */
async function loadAreas() {
  const res = await fetch(`${API_BASE}/areas`);
  const areas = await res.json();

  const select = document.getElementById("areaSelect");
  select.innerHTML = "";

  areas.forEach((area) => {
    const opt = document.createElement("option");
    opt.value = area;
    opt.textContent = area;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    loadDeliveries(select.value);
  });

  if (areas.length > 0) {
    loadDeliveries(areas[0]);
  }
}

/* ================= 배달 핀 표시 ================= */
async function loadDeliveries(area) {
  const res = await fetch(
    `${API_BASE}/deliveries?area=${encodeURIComponent(area)}`
  );
  const json = await res.json();

  clearMarkers();

  json.data.forEach((item) => {
    // 구조: [rank, addr, lat, lon, memo]
    const lat = item[2];
    const lon = item[3];
    const memo = item[4];

    const position = new kakao.maps.LatLng(lat, lon);

    const marker = new kakao.maps.Marker({
      map,
      position,
    });

    kakao.maps.event.addListener(marker, "click", () => {
      if (infoWindow) infoWindow.close();

      infoWindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:6px;font-size:13px;">${memo}</div>`,
      });

      infoWindow.open(map, marker);
    });

    markers.push(marker);
  });

  // 첫 핀 기준으로 지도 이동
  if (markers.length > 0) {
    map.setCenter(markers[0].getPosition());
  }
}

/* ================= 마커 제거 ================= */
function clearMarkers() {
  markers.forEach((m) => m.setMap(null));
  markers = [];
}

/* ================= 시작 ================= */
window.onload = initMap;
