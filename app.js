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

  centerMapToMyLocation(); // 최초 1회 내 위치 중심
  loadAreas();
  startGpsTracking();
}

/* ================= 최초 내 위치 중심 ================= */
function centerMapToMyLocation() {
  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition((pos) => {
    map.setCenter(
      new kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude)
    );
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
  const geometry = json.route.geometry;

  /* ---------- 배달 숫자 마커 ---------- */
  deliveries.forEach(([order, addr, lat, lon, memo]) => {
    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(lat, lon),
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

  /* ---------- OSRM 도로 경로만 화살표 표시 ---------- */
  drawOsrmRoute(geometry);
}

/* ================= OSRM 경로 (화살표) ================= */
function drawOsrmRoute(geometry) {
  if (routeLine) routeLine.setMap(null);

  const path = geometry.map(([lat, lon]) => new kakao.maps.LatLng(lat, lon));

  routeLine = new kakao.maps.Polyline({
    path,
    strokeWeight: 5,
    strokeColor: "#007AFF",
    strokeOpacity: 0.9,
    strokeStyle: "arrow", // 🔥 가는 길 방향
    zIndex: 3,
  });

  routeLine.setMap(map);
}

/* ================= GPS 현재 위치 ================= */
function startGpsTracking() {
  if (!navigator.geolocation) return;

  setInterval(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const currentPos = new kakao.maps.LatLng(
        pos.coords.latitude,
        pos.coords.longitude
      );

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
