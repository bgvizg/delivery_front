const API_BASE = "https://beauty-continental-chassis-vat.trycloudflare.com";

let map;
let deliveryOverlays = [];
let routeLine = null;
let myLocationMarker = null;

/* ================= 지도 초기화 ================= */
function initMap() {
  map = new kakao.maps.Map(document.getElementById("map"), {
    center: new kakao.maps.LatLng(38.060335, 128.166252),
    level: 5,
  });

  centerMapToMyLocation();
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

  select.onchange = () => loadRoute(select.value);

  if (areas.length > 0) loadRoute(areas[0]);
}

/* ================= 경로 + 배달 데이터 ================= */
async function loadRoute(area) {
  const res = await fetch(`${API_BASE}/route?area=${encodeURIComponent(area)}`);
  const json = await res.json();

  clearDeliveries();

  const deliveries = json.deliveries;
  const geometry = json.route.geometry;

  deliveries.forEach(
  ([order, addr, lat, lon, memo, name, phoneNumber, wantsDelivery]) => {
    const safeAddr = (addr || "").replace(/'/g, "\\'");
    const safeMemo = (memo || "").replace(/'/g, "\\'");
    const safeName = (name || "").replace(/'/g, "\\'");
    const safePhone = (phoneNumber || "").replace(/'/g, "\\'");

    let markerClass;

    if (order === 0) {
      // 🔵 최우선
      markerClass = "order-marker-start";
    } else if (!wantsDelivery) {
      // ⚪ 부재
      markerClass = "order-marker-nondelivery";
    } else if (memo && memo.trim().length > 0) {
      // 🟡 메모 있음
      markerClass = "order-marker-memo";
    } else {
      // 🔴 일반 배송
      markerClass = "order-marker-delivery";
    }

    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(lat, lon),
      content: `
        <div class="${markerClass}"
             onclick="showInfo('${safeAddr}', '${safeMemo}', '${safeName}', '${safePhone}', ${lat}, ${lon})">
          ${order}
        </div>
      `,
      yAnchor: 1,
      zIndex: 3,
    });

    overlay.setMap(map);
    deliveryOverlays.push(overlay);
  }
);

  drawOsrmRoute(geometry);
}

/* ================= OSRM 경로 ================= */
function drawOsrmRoute(geometry) {
  if (routeLine) routeLine.setMap(null);

  const path = geometry.map(([lat, lon]) => new kakao.maps.LatLng(lat, lon));

  routeLine = new kakao.maps.Polyline({
    path,
    strokeWeight: 5,
    strokeColor: "#007AFF",
    strokeOpacity: 0.9,
    strokeStyle: "solid",
    zIndex: 3,
  });

  routeLine.setMap(map);
}

/* ================= 배달 정보 카드 ================= */
function showInfo(addr, memo, name, phoneNumber, lat, lon) {
  const old = document.getElementById("infoCard");
  if (old) old.remove();

  const div = document.createElement("div");
  div.id = "infoCard";
  div.className = "info-card";
  div.innerHTML = `
    <h3>${addr || "-"}</h3>
    <p><b>성함</b><br/>${name || "-"}</p>
    <p><b>전화번호</b><br/>${phoneNumber || "-"}</p>
    <p><b>메모</b><br/>${memo || "-"}</p>

    <button class="navi-btn"
      onclick="startKakaoNavi(${lat}, ${lon}, '${addr}')">
      카카오맵으로 경로 안내 (모바일 전용)
    </button>
    <button onclick="document.getElementById('infoCard').remove()">닫기</button>
  `;

  document.body.appendChild(div);
}

/* ================= GPS 현재 위치 ================= */
function startGpsTracking() {
  if (!navigator.geolocation) return;

  navigator.geolocation.watchPosition(
    (pos) => {
      const currentPos = new kakao.maps.LatLng(
        pos.coords.latitude,
        pos.coords.longitude
      );

      if (!myLocationMarker) {
        myLocationMarker = new kakao.maps.Marker({
          position: currentPos,
          map: map,
          zIndex: 10,
        });
      } else {
        myLocationMarker.setPosition(currentPos);
      }
    },
    (err) => {
      console.error("GPS 오류", err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    }
  );
}

/* ================== 네비 ================== */
function startKakaoNavi(lat, lon, name) {
  const encodedName = encodeURIComponent(name);
  const url = `kakaomap://route?ep=${lat},${lon}&en=${encodedName}&by=CAR`;
  location.href = url;
}

/* ================= 초기화 ================= */
function clearDeliveries() {
  deliveryOverlays.forEach((o) => o.setMap(null));
  deliveryOverlays = [];

  if (routeLine) routeLine.setMap(null);
}

window.onload = initMap;
