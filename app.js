const API_BASE = "https://remains-counting-say-perception.trycloudflare.com";

let map;
let deliveryOverlays = [];
let routeLine = null;
let myLocationMarker = null;

/* ================= 지도 초기화 ================= */
function initMap() {
  map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(37.5665, 126.978),
    level: 5,
  });

  loadAreas();
  startGpsTracking();
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

  if (areas.length > 0) loadDeliveries(areas[0]);
}

/* ================= 배달 데이터 ================= */
async function loadDeliveries(area) {
  const res = await fetch(
    `${API_BASE}/deliveries?area=${encodeURIComponent(area)}`
  );
  const json = await res.json();

  clearDeliveries();

  // 배달 순서 기준 정렬
  const sorted = json.data.sort((a, b) => a[0] - b[0]);

  const path = [];

  sorted.forEach(([order, addr, lat, lon, memo]) => {
    const pos = new kakao.maps.LatLng(lat, lon);
    path.push(pos);

    // 숫자 마커 (CustomOverlay)
    const overlay = new kakao.maps.CustomOverlay({
      position: pos,
      content: `<div class="order-marker">${order}</div>`,
      yAnchor: 1,
    });

    overlay.setMap(map);

    // 클릭 시 memo 표시
    kakao.maps.event.addListener(overlay, "click", () => {
      alert(`메모: ${memo}`);
    });

    deliveryOverlays.push(overlay);
  });

  drawRoute(path);

  if (path.length > 0) map.setCenter(path[0]);
}

/* ================= 경로 (화살표) ================= */
function drawRoute(path) {
  if (routeLine) routeLine.setMap(null);

  routeLine = new kakao.maps.Polyline({
    path,
    strokeWeight: 5,
    strokeColor: "#007AFF",
    strokeOpacity: 0.8,
    strokeStyle: "arrow",
  });

  routeLine.setMap(map);
}

/* ================= GPS 현재 위치 ================= */
function startGpsTracking() {
  if (!navigator.geolocation) return;

  setInterval(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      const currentPos = new kakao.maps.LatLng(lat, lon);

      if (!myLocationMarker) {
        myLocationMarker = new kakao.maps.Marker({
          position: currentPos,
          map,
          image: new kakao.maps.MarkerImage(
            "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
            new kakao.maps.Size(24, 35)
          ),
        });
      } else {
        myLocationMarker.setPosition(currentPos);
      }
    });
  }, 3000);
}

/* ================= 초기화 ================= */
function clearDeliveries() {
  deliveryOverlays.forEach((o) => o.setMap(null));
  deliveryOverlays = [];

  if (routeLine) routeLine.setMap(null);
}

window.onload = initMap;
