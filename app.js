const API_BASE = "https://remains-counting-say-perception.trycloudflare.com";

let map;
let deliveryOverlays = [];
let routeLine = null;
let myLocationMarker = null;
let isMapCentered = false;

/* ================= 지도 초기화 ================= */
function initMap() {
  map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(37.5665, 126.978), // 임시
    level: 5,
  });

  centerMapToMyLocation(); // 🔥 최초 1회만 중심 이동
  loadAreas();
  startGpsTracking();
}

/* ================= 최초 내 위치 중심 ================= */
function centerMapToMyLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition((pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const myPos = new kakao.maps.LatLng(lat, lon);

    map.setCenter(myPos);
    isMapCentered = true;
  });
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
    loadRoute(select.value);
  });

  if (areas.length > 0) loadRoute(areas[0]);
}

/* ================= 경로 + 배달 데이터 ================= */
async function loadRoute(area) {
  const res = await fetch(`${API_BASE}/route?area=${encodeURIComponent(area)}`);
  const json = await res.json();

  clearDeliveries();

  const deliveries = json.deliveries;
  const route = json.route;

  /* ---------- 배달 숫자 마커 ---------- */
  deliveries.forEach(([order, addr, lat, lon, memo]) => {
    const pos = new kakao.maps.LatLng(lat, lon);

    const overlay = new kakao.maps.CustomOverlay({
      position: pos,
      content: `
        <div class="order-marker" onclick="alert('메모: ${memo}')">
          ${order}
        </div>
      `,
      yAnchor: 1,
      zIndex: 2,
    });

    overlay.setMap(map);
    deliveryOverlays.push(overlay);
  });

  /* ---------- OSRM 경로 (배달 순서 기준) ---------- */
  drawRoute(route.geometry);
}

/* ================= 경로 (화살표) ================= */
function drawRoute(geometry) {
  if (routeLine) routeLine.setMap(null);

  const path = geometry.map(([lat, lon]) => new kakao.maps.LatLng(lat, lon));

  routeLine = new kakao.maps.Polyline({
    path,
    strokeWeight: 5,
    strokeColor: "#007AFF",
    strokeOpacity: 0.9,
    strokeStyle: "arrow",
    zIndex: 3,
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
          zIndex: 10, // 🔥 항상 최상단
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
