# Riftbound Content API Guide

API Riftbound Content cung cấp danh sách các bộ thẻ và toàn bộ thông tin thẻ tương ứng.

## Endpoint

```http
GET /riftbound/content/v1/contents
```

> Base URL không có trong tài liệu nguồn. Hãy thay `<BASE_URL>` bằng URL của region được Riot cung cấp.

## Xác thực

Endpoint hỗ trợ API key qua query parameter hoặc header parameter. Tài liệu nguồn đánh dấu API key là không bắt buộc, nhưng quyền truy cập thực tế vẫn phụ thuộc vào policy của môi trường đang sử dụng.

Không ghi trực tiếp API key vào mã nguồn hoặc commit API key vào Git.

## Region

Region hiện được nêu trong tài liệu:

- `AMERICAS`

Hãy chọn base URL tương ứng với region trước khi gửi request.

## Query parameters

| Tên | Kiểu | Bắt buộc | Mặc định | Mô tả |
| --- | --- | --- | --- | --- |
| `locale` | `string` | Không | `en` | Ngôn ngữ và thiết lập vùng của response. Trong giai đoạn beta chỉ hỗ trợ `en`. |

## Ví dụ request

Không có API key:

```bash
curl --request GET \
  --url '<BASE_URL>/riftbound/content/v1/contents?locale=en' \
  --header 'Accept: application/json'
```

Nếu hệ thống yêu cầu API key qua header, thay `<API_KEY_HEADER>` bằng tên header do nhà cung cấp quy định:

```bash
curl --request GET \
  --url '<BASE_URL>/riftbound/content/v1/contents?locale=en' \
  --header 'Accept: application/json' \
  --header '<API_KEY_HEADER>: <API_KEY>'
```

## Response thành công

Endpoint trả về một đối tượng `RiftboundContentDTO`.

### `RiftboundContentDTO`

| Field | Kiểu | Mô tả |
| --- | --- | --- |
| `game` | `string` | Tên game. |
| `version` | `string` | Phiên bản nội dung. |
| `lastUpdated` | `string` | Thời điểm nội dung được cập nhật gần nhất theo định dạng ISO timestamp. |
| `sets` | `SetDTO[]` | Danh sách bộ thẻ. |

### `SetDTO`

| Field | Kiểu | Mô tả |
| --- | --- | --- |
| `id` | `string` | ID của bộ thẻ. |
| `name` | `string` | Tên bộ thẻ. |
| `cards` | `CardDTO[]` | Danh sách thẻ thuộc bộ. |

### `CardDTO`

| Field | Kiểu | Mô tả |
| --- | --- | --- |
| `id` | `string` | ID của thẻ. |
| `collectorNumber` | `long` | Số thứ tự sưu tầm. |
| `set` | `string` | Bộ thẻ chứa thẻ này. |
| `name` | `string` | Tên thẻ. |
| `description` | `string` | Nội dung mô tả thẻ. |
| `type` | `string` | Loại thẻ. |
| `rarity` | `string` | Độ hiếm. |
| `faction` | `string` | Phe của thẻ. |
| `stats` | `CardStatsDTO` | Các chỉ số của thẻ. |
| `keywords` | `string[]` | Danh sách từ khóa. |
| `art` | `CardArtDTO` | Thông tin hình ảnh. |
| `flavorText` | `string` | Flavor text của thẻ. |
| `tags` | `string[]` | Danh sách tag. |

### `CardStatsDTO`

| Field | Kiểu | Mô tả |
| --- | --- | --- |
| `energy` | `long` | Chỉ số energy. |
| `might` | `long` | Chỉ số might. |
| `cost` | `long` | Chi phí sử dụng. |
| `power` | `long` | Chỉ số power. |

### `CardArtDTO`

| Field | Kiểu | Mô tả |
| --- | --- | --- |
| `thumbnailURL` | `string` | URL ảnh thu nhỏ. |
| `fullURL` | `string` | URL ảnh đầy đủ. |
| `artist` | `string` | Tên họa sĩ. |

## Ví dụ response

Ví dụ dưới đây chỉ minh họa cấu trúc; các giá trị không phải dữ liệu chính thức:

```json
{
  "game": "Riftbound",
  "version": "<CONTENT_VERSION>",
  "lastUpdated": "2026-01-01T00:00:00Z",
  "sets": [
    {
      "id": "<SET_ID>",
      "name": "<SET_NAME>",
      "cards": [
        {
          "id": "<CARD_ID>",
          "collectorNumber": 1,
          "set": "<SET_ID>",
          "name": "<CARD_NAME>",
          "description": "<CARD_DESCRIPTION>",
          "type": "<CARD_TYPE>",
          "rarity": "<RARITY>",
          "faction": "<FACTION>",
          "stats": {
            "energy": 0,
            "might": 0,
            "cost": 0,
            "power": 0
          },
          "keywords": [],
          "art": {
            "thumbnailURL": "<THUMBNAIL_URL>",
            "fullURL": "<FULL_IMAGE_URL>",
            "artist": "<ARTIST_NAME>"
          },
          "flavorText": "<FLAVOR_TEXT>",
          "tags": []
        }
      ]
    }
  ]
}
```

## HTTP errors

| Status | Ý nghĩa |
| --- | --- |
| `400` | Bad request — request không hợp lệ. |
| `401` | Unauthorized — chưa xác thực hoặc thông tin xác thực không hợp lệ. |
| `403` | Forbidden — không có quyền truy cập. |
| `404` | Data not found — không tìm thấy dữ liệu. |
| `405` | Method not allowed — HTTP method không được hỗ trợ. |
| `415` | Unsupported media type — media type không được hỗ trợ. |
| `429` | Rate limit exceeded — vượt quá giới hạn request. |
| `500` | Internal server error — lỗi nội bộ server. |
| `502` | Bad gateway — gateway nhận response không hợp lệ. |
| `503` | Service unavailable — dịch vụ tạm thời không khả dụng. |
| `504` | Gateway timeout — gateway hết thời gian chờ. |

## Lưu ý tích hợp

- Chỉ truyền `locale=en` trong giai đoạn beta.
- Xử lý `429` bằng retry có exponential backoff và giới hạn số lần thử.
- Có thể cache response theo `version` hoặc `lastUpdated` để tránh tải lại dữ liệu không thay đổi.
- Không giả định mọi chuỗi hoặc danh sách luôn có dữ liệu; client nên xử lý giá trị rỗng an toàn.
- Khi gặp thông báo `This API endpoint is not available in your policy`, cần kiểm tra policy, sản phẩm API và quyền của API key. Đây không phải lỗi schema của request.
