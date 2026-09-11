import exifr from 'exifr';

export interface ExifResult {
  date: string | null;       // YYYY-MM-DD
  dateTime: Date | null;
  latitude: number | null;
  longitude: number | null;
  province: string | null;
  city: string | null;
  location: string | null;
}

// 常见中国核心旅游/主要城市中心点坐标库（离线纯本地匹配，0 外网泄露风险）
const CITY_COORDINATES: Array<{ province: string; city: string; lat: number; lng: number }> = [
  // 湖北
  { province: '湖北省', city: '武汉市', lat: 30.5928, lng: 114.3055 },
  { province: '湖北省', city: '襄阳市', lat: 32.0086, lng: 112.1224 },
  { province: '湖北省', city: '宜昌市', lat: 30.6919, lng: 111.2865 },
  { province: '湖北省', city: '十堰市', lat: 32.6293, lng: 110.7981 },
  { province: '湖北省', city: '荆州', lat: 30.3352, lng: 112.2418 },
  { province: '湖北省', city: '恩施州', lat: 30.2728, lng: 109.4870 },
  // 北京/上海/天津/重庆
  { province: '北京市', city: '北京市', lat: 39.9042, lng: 116.4074 },
  { province: '上海市', city: '上海市', lat: 31.2304, lng: 121.4737 },
  { province: '天津市', city: '天津市', lat: 39.1256, lng: 117.1902 },
  { province: '重庆市', city: '重庆市', lat: 29.5630, lng: 106.5516 },
  // 浙江
  { province: '浙江省', city: '杭州市', lat: 30.2741, lng: 120.1551 },
  { province: '浙江省', city: '宁波市', lat: 29.8683, lng: 121.5440 },
  { province: '浙江省', city: '温州市', lat: 27.9943, lng: 120.6994 },
  { province: '浙江省', city: '嘉兴市', lat: 30.7461, lng: 120.7555 },
  { province: '浙江省', city: '湖州市', lat: 30.8943, lng: 120.0868 },
  { province: '浙江省', city: '绍兴市', lat: 30.0024, lng: 120.5821 },
  { province: '浙江省', city: '舟山市', lat: 29.9853, lng: 122.2072 },
  // 江苏
  { province: '江苏省', city: '南京市', lat: 32.0603, lng: 118.7969 },
  { province: '江苏省', city: '苏州市', lat: 31.2990, lng: 120.5853 },
  { province: '江苏省', city: '无锡市', lat: 31.4912, lng: 120.3119 },
  { province: '江苏省', city: '常州市', lat: 31.8112, lng: 119.9741 },
  { province: '江苏省', city: '扬州市', lat: 32.3942, lng: 119.4129 },
  // 广东
  { province: '广东省', city: '广州市', lat: 23.1291, lng: 113.2644 },
  { province: '广东省', city: '深圳市', lat: 22.5431, lng: 114.0579 },
  { province: '广东省', city: '珠海市', lat: 22.2707, lng: 113.5767 },
  { province: '广东省', city: '佛山市', lat: 23.0215, lng: 113.1214 },
  { province: '广东省', city: '东莞市', lat: 23.0207, lng: 113.7518 },
  // 四川
  { province: '四川省', city: '成都市', lat: 30.5728, lng: 104.0668 },
  { province: '四川省', city: '绵阳市', lat: 31.4675, lng: 104.6791 },
  { province: '四川省', city: '乐山市', lat: 29.5521, lng: 103.7656 },
  { province: '四川省', city: '阿坝州', lat: 31.8994, lng: 102.2246 },
  // 湖南
  { province: '湖南省', city: '长沙市', lat: 28.2282, lng: 112.9388 },
  { province: '湖南省', city: '张家界市', lat: 29.1171, lng: 110.4792 },
  { province: '湖南省', city: '湘西州', lat: 28.3119, lng: 109.7390 },
  // 陕西
  { province: '陕西省', city: '西安市', lat: 34.3416, lng: 108.9398 },
  // 云南
  { province: '云南省', city: '昆明市', lat: 24.8801, lng: 102.8329 },
  { province: '云南省', city: '大理州', lat: 25.6065, lng: 100.2676 },
  { province: '云南省', city: '丽江市', lat: 26.8550, lng: 100.2300 },
  // 福建
  { province: '福建省', city: '厦门市', lat: 24.4798, lng: 118.0894 },
  { province: '福建省', city: '福州市', lat: 26.0745, lng: 119.2965 },
  // 海南
  { province: '海南省', city: '三亚市', lat: 18.2528, lng: 109.5120 },
  { province: '海南省', city: '海口市', lat: 20.0440, lng: 110.1999 },
  // 山东
  { province: '山东省', city: '青岛市', lat: 36.0671, lng: 120.3826 },
  { province: '山东省', city: '济南市', lat: 36.6512, lng: 117.1201 },
  // 河南
  { province: '河南省', city: '郑州市', lat: 34.7466, lng: 113.6254 },
  { province: '河南省', city: '洛阳市', lat: 34.6185, lng: 112.4540 },
];

/**
 * 计算两个经纬度坐标之间的球面距离 (单位: 公里)
 */
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球半径 km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 根据经纬度离线匹配最近的城市 (最近且距离 < 80km)
 */
export function matchCityFromCoords(lat: number, lng: number): { province: string; city: string } | null {
  let closest: { province: string; city: string; dist: number } | null = null;
  for (const item of CITY_COORDINATES) {
    const dist = getDistanceKm(lat, lng, item.lat, item.lng);
    if (!closest || dist < closest.dist) {
      closest = { province: item.province, city: item.city, dist };
    }
  }
  // 阈值 80 公里内算作对应城市市区或周边
  if (closest && closest.dist <= 80) {
    return { province: closest.province, city: closest.city };
  }
  return null;
}

/**
 * 格式化 Date 为 YYYY-MM-DD
 */
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 解析图片 Buffer 中的 EXIF 元数据
 */
export async function parsePhotoExif(buffer: Buffer): Promise<ExifResult> {
  const result: ExifResult = {
    date: null,
    dateTime: null,
    latitude: null,
    longitude: null,
    province: null,
    city: null,
    location: null,
  };

  try {
    const data = await exifr.parse(buffer, {
      tiff: true,
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude']
    });

    if (!data) return result;

    const dateVal = data.DateTimeOriginal || data.CreateDate;
    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      result.dateTime = dateVal;
      result.date = formatDate(dateVal);
    }

    if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
      result.latitude = data.latitude;
      result.longitude = data.longitude;
      const matched = matchCityFromCoords(data.latitude, data.longitude);
      if (matched) {
        result.province = matched.province;
        result.city = matched.city;
        result.location = `${matched.province} · ${matched.city}`;
      }
    }
  } catch (err: any) {
    // 允许解析失败降级
    console.warn('[EXIF] 解析失败或无元数据:', err?.message || err);
  }

  return result;
}
