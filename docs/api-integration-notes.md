# API integration notes

Tài liệu này lưu các API và response mẫu để phân tích, tổng kết và ghép thành luồng tích hợp hoàn chỉnh.

## Thông tin chung

- Base URL: `https://api.riftcodex.com`
- Định dạng response: JSON
- Xác thực: Không yêu cầu đối với các thao tác đọc

## API đã ghi nhận

### 1. Lấy danh sách thẻ

- Method: `GET`
- Endpoint: `/cards`
- URL mẫu: `https://api.riftcodex.com/cards?dir=1&page=1&size=50`

#### Query parameters

| Tên      | Vị trí | Giá trị mẫu | Ghi chú                                               |
| -------- | ------ | ----------- | ----------------------------------------------------- |
| `page`   | query  | `1`         | Trang hiện tại                                        |
| `size`   | query  | `50`        | Số bản ghi mỗi trang; từ `1` đến `100`                |
| `dir`    | query  | `1`         | `1`: tăng dần; `-1`: giảm dần                         |
| `sort`   | query  | —           | Trường dùng để sắp xếp                                |
| `set_id` | query  | —           | Lọc theo Riftbound set ID, không phân biệt hoa thường |
| `new`    | query  | `true`      | Lọc theo trạng thái thẻ mới                           |

#### Request mẫu

```http
GET https://api.riftcodex.com/cards?dir=1&page=1&size=50
```

#### Response mẫu

Request đã kiểm tra:

```http
GET https://api.riftcodex.com/cards?page=1&size=2
```

Response có dạng:

```json
{
  "items": [
    {
      "id": "69c4407c9288b1e85d94de8a",
      "name": "Vi - Piltover Enforcer (Signature)",
      "riftbound_id": "unl-229*-219",
      "tcgplayer_id": "685522",
      "collector_number": 229,
      "attributes": {
        "energy": null,
        "might": null,
        "power": null
      },
      "classification": {
        "type": "Legend",
        "supertype": null,
        "rarity": "Rare",
        "domain": ["Fury", "Order"]
      },
      "text": {
        "rich": "<p>When you conquer, if you assigned 3 or more excess damage, you may exhaust me to ready a unit.</p>",
        "plain": "When you conquer, if you assigned 3 or more excess damage, you may exhaust me to ready a unit.",
        "flavour": null
      },
      "set": {
        "set_id": "UNL",
        "label": "Unleashed"
      },
      "media": {
        "image_url": "https://cmsassets.rgpub.io/sanity/images/dsfx7636/game_data_live/0febae9c611339d9ed65c7ebe43237b5ec42c9a3-744x1039.png?accountingTag=RB",
        "artist": "Jonathan Santoro",
        "accessibility_text": "Riftbound Legend: Piltover Enforcer. When you conquer, if you assigned 3 or more excess damage, you may exhaust me to ready a unit."
      },
      "tags": ["Vi"],
      "orientation": "portrait",
      "metadata": {
        "clean_name": "Vi Piltover Enforcer Signature",
        "updated_on": "2026-07-10T22:45:08.861364+00:00",
        "alternate_art": false,
        "overnumbered": false,
        "signature": true
      },
      "new": false
    }
  ],
  "total": 1451,
  "page": 1,
  "size": 2,
  "pages": 726
}
```

Response gốc có 2 phần tử. Ví dụ trên giữ một phần tử đại diện để tài liệu gọn hơn; phần tử thứ hai xác nhận các trường nullable cũng có thể nhận số/chuỗi, như `energy: 3`, `might: 2` và `flavour` là string.

### 2. Tìm kiếm thẻ toàn văn

> Trạng thái: **WIP** — endpoint vẫn đang được phát triển và có thể thay đổi.

- Method: `GET`
- Endpoint: `/cards/search`
- Mục đích: Tìm kiếm toàn văn trên nội dung của thẻ; hỗ trợ lọc theo set, trạng thái thẻ mới, sắp xếp và phân trang.

#### Query parameters

| Tên      | Kiểu                 | Bắt buộc | Mặc định / giới hạn             | Mô tả                                                            |
| -------- | -------------------- | -------- | ------------------------------- | ---------------------------------------------------------------- |
| `query`  | string               | Có       | —                               | Chuỗi tìm kiếm toàn văn trên nội dung thẻ                        |
| `sort`   | `CardSortCategories` | Không    | —                               | Trường sắp xếp, ví dụ: `name`, `collector_number`, `set_id`      |
| `dir`    | integer              | Không    | `1`                             | Hướng sắp xếp: `1` tăng dần, `-1` giảm dần                       |
| `set_id` | string               | Không    | —                               | Riftbound set ID, ví dụ `sfd`, `ogn`; không phân biệt hoa thường |
| `new`    | boolean              | Không    | —                               | `true` để chỉ lấy các thẻ mới                                    |
| `page`   | integer              | Không    | Mặc định `1`, nhỏ nhất `1`      | Trang hiện tại                                                   |
| `size`   | integer              | Không    | Mặc định `50`, từ `1` đến `100` | Số bản ghi mỗi trang                                             |

#### Request mẫu

```http
GET https://api.riftcodex.com/cards/search?query={search_text}&page=1&size=50&dir=1
```

#### Response mẫu

Request đã kiểm tra:

```http
GET https://api.riftcodex.com/sets?page=1&size=10
```

Response pagination:

```json
{
  "items": [
    {
      "id": "69bc5bf6e195be3e561d1eb3",
      "name": "Riftbound Organized Play Promotional Cards",
      "set_id": "OPP",
      "card_count": 133,
      "tcgplayer_id": "24343",
      "cardmarket_id": ["6322", "6483"],
      "published_on": "2025-10-31T00:00:00"
    },
    {
      "id": "69bc5bf6e195be3e561d1eaf",
      "name": "Spiritforged",
      "set_id": "SFD",
      "card_count": 288,
      "tcgplayer_id": "24519",
      "cardmarket_id": "6399",
      "published_on": "2026-02-13T00:00:00"
    },
    {
      "id": "6a32e5e7189085654c4f249e",
      "name": "Vendetta",
      "set_id": "VEN",
      "card_count": 358,
      "tcgplayer_id": null,
      "cardmarket_id": null,
      "published_on": "2026-07-31T00:00:00"
    }
  ],
  "total": 8,
  "page": 1,
  "size": 10,
  "pages": 1
}
```

Response gốc có đủ 8 set. Ba phần tử đại diện trên thể hiện toàn bộ biến thể kiểu dữ liệu quan trọng của các ID bên ngoài.

### 3. Tìm thẻ theo tên

- Method: `GET`
- Endpoint: `/cards/name`
- Mục đích: Tìm thẻ theo tên chính xác hoặc gần đúng; so khớp không phân biệt hoa thường.

#### Query parameters

| Tên      | Kiểu                 | Bắt buộc | Mặc định / giới hạn             | Mô tả                                                            |
| -------- | -------------------- | -------- | ------------------------------- | ---------------------------------------------------------------- |
| `exact`  | string               | Không    | —                               | Tìm tên khớp chính xác, không phân biệt hoa thường               |
| `fuzzy`  | string               | Không    | —                               | Tìm tên gần đúng, không phân biệt hoa thường                     |
| `sort`   | `CardSortCategories` | Không    | —                               | Trường sắp xếp, ví dụ: `name`, `collector_number`, `set_id`      |
| `dir`    | integer              | Không    | `1`                             | Hướng sắp xếp: `1` tăng dần, `-1` giảm dần                       |
| `set_id` | string               | Không    | —                               | Riftbound set ID, ví dụ `sfd`, `ogn`; không phân biệt hoa thường |
| `new`    | boolean              | Không    | —                               | `true` để chỉ lấy các thẻ mới                                    |
| `page`   | integer              | Không    | Mặc định `1`, nhỏ nhất `1`      | Trang hiện tại                                                   |
| `size`   | integer              | Không    | Mặc định `50`, từ `1` đến `100` | Số bản ghi mỗi trang                                             |

#### Request mẫu

Tìm chính xác:

```http
GET https://api.riftcodex.com/cards/name?exact=master+yi+honed
```

Tìm gần đúng:

```http
GET https://api.riftcodex.com/cards/name?fuzzy=yi+hone
```

#### Response mẫu

Đã kiểm tra fuzzy search:

```http
GET https://api.riftcodex.com/cards/name?fuzzy=yi+hone&size=2
```

```json
{
  "items": [
    {
      "id": "69bc5bf3d308c64675ca8a19",
      "name": "Master Yi - Honed",
      "riftbound_id": "opp-009-024",
      "tcgplayer_id": "680376",
      "collector_number": 9,
      "attributes": { "energy": 7, "might": 6, "power": 1 },
      "classification": {
        "type": "Unit",
        "supertype": "Champion",
        "rarity": "Promo",
        "domain": ["Body"]
      },
      "set": {
        "set_id": "OPP",
        "label": "Riftbound Organized Play Promotional Cards"
      },
      "tags": ["Master Yi", "Ionia"],
      "orientation": "portrait",
      "new": false
    },
    {
      "id": "69bc5bd9d308c64675ca881e",
      "name": "Master Yi - Honed",
      "riftbound_id": "ogs-009-024",
      "tcgplayer_id": "653144",
      "collector_number": 9,
      "attributes": { "energy": 7, "might": 6, "power": 1 },
      "classification": {
        "type": "Unit",
        "supertype": "Champion",
        "rarity": "Epic",
        "domain": ["Body"]
      },
      "set": { "set_id": "OGS", "label": "Proving Grounds" },
      "tags": ["Master Yi", "Ionia"],
      "orientation": "portrait",
      "new": false
    }
  ],
  "total": 10,
  "page": 1,
  "size": 2,
  "pages": 5
}
```

`text`, `media` và `metadata` có đầy đủ trong cả hai phần tử nhưng được lược bớt ở ví dụ trên. Response xác nhận endpoint dùng cùng schema `PaginatedCards` với `/cards`.

#### Quan sát từ response

- Một tên card có thể trả nhiều bản in thuộc các set và rarity khác nhau.
- Không dùng `name` làm khóa duy nhất; dùng `id` hoặc `riftbound_id` để chọn đúng phiên bản.
- `text.rich` giữ HTML và `<br />`; `text.plain` trong ví dụ nối hai câu mà không chèn khoảng trắng tại vị trí `<br />`.
- `media.accessibility_text` có thể chứa ký tự xuống dòng.

### 4. Lấy thẻ theo Riftcodex ID

- Method: `GET`
- Endpoint: `/cards/{id}`
- Mục đích: Lấy thông tin chi tiết của một thẻ bằng Riftcodex ID.

#### Path parameters

| Tên  | Kiểu   | Bắt buộc | Mô tả                |
| ---- | ------ | -------- | -------------------- |
| `id` | string | Có       | Riftcodex ID của thẻ |

#### Request mẫu

```http
GET https://api.riftcodex.com/cards/69a6336b829d03360413d515
```

```bash
curl "https://api.riftcodex.com/cards/69a6336b829d03360413d515"
```

#### Response mẫu

_Chưa được cung cấp._

### 5. Lấy thẻ theo Riftbound ID

- Method: `GET`
- Endpoint: `/cards/riftbound/{id}`
- Mục đích: Lấy các thẻ theo Riftbound ID.
- So khớp: Không phân biệt hoa thường và hỗ trợ khớp một phần.

#### Path parameters

| Tên  | Kiểu   | Bắt buộc | Mô tả                                                                 |
| ---- | ------ | -------- | --------------------------------------------------------------------- |
| `id` | string | Có       | Riftbound ID đầy đủ hoặc một phần, ví dụ `ogn-011-298` hoặc `ogn-011` |

#### Request mẫu

```http
GET https://api.riftcodex.com/cards/riftbound/ogn-011-298
```

Khớp một phần:

```http
GET https://api.riftcodex.com/cards/riftbound/ogn-011
```

#### Response mẫu

_Chưa được cung cấp._

### 6. Lấy thẻ theo TCGPlayer ID

- Method: `GET`
- Endpoint: `/cards/tcgplayer/{tcgplayer_id}`
- Mục đích: Lấy một thẻ theo TCGPlayer ID, còn được gọi là `productID` trong TCGPlayer.

#### Path parameters

| Tên            | Kiểu   | Bắt buộc | Mô tả                                        |
| -------------- | ------ | -------- | -------------------------------------------- |
| `tcgplayer_id` | string | Có       | TCGPlayer ID / TCGPlayer `productID` của thẻ |

#### Request mẫu

```http
GET https://api.riftcodex.com/cards/tcgplayer/652782
```

```bash
curl "https://api.riftcodex.com/cards/tcgplayer/652782"
```

#### Response mẫu

_Chưa được cung cấp._

### 7. Lấy danh sách set

- Method: `GET`
- Endpoint: `/sets`
- Mục đích: Lấy danh sách set có phân trang.

#### Query parameters

| Tên    | Kiểu    | Bắt buộc | Mặc định / giới hạn             | Mô tả                |
| ------ | ------- | -------- | ------------------------------- | -------------------- |
| `page` | integer | Không    | Mặc định `1`, nhỏ nhất `1`      | Trang hiện tại       |
| `size` | integer | Không    | Mặc định `50`, từ `1` đến `100` | Số bản ghi mỗi trang |

#### Request mẫu

```http
GET https://api.riftcodex.com/sets
```

```bash
curl "https://api.riftcodex.com/sets"
```

#### Response mẫu

_Chưa được cung cấp._

### 8. Lấy set theo Riftbound set ID

- Method: `GET`
- Endpoint: `/sets/set-id/{set_id}`
- Mục đích: Lấy một set theo Riftbound set ID.
- So khớp: Không phân biệt hoa thường.

#### Path parameters

| Tên      | Kiểu   | Bắt buộc | Mô tả                                |
| -------- | ------ | -------- | ------------------------------------ |
| `set_id` | string | Có       | Riftbound set ID, ví dụ `sfd`, `ogn` |

#### Request mẫu

```http
GET https://api.riftcodex.com/sets/set-id/ogn
```

```bash
curl "https://api.riftcodex.com/sets/set-id/ogn"
```

#### Response mẫu

Status: `200 OK`

```json
{
  "card_count": 95,
  "cardmarket_id": ["6322", "6483"],
  "id": "69a7184cbddee0883890186a",
  "name": "Riftbound Organized Play Promotional Cards",
  "published_on": "2025-10-31T00:00:00",
  "set_id": "OPP",
  "tcgplayer_id": "24343"
}
```

#### Quan sát từ response

- `cardmarket_id` là một mảng chuỗi và có thể chứa nhiều ID.
- `tcgplayer_id` là một chuỗi đơn.
- `published_on` chứa ngày giờ theo dạng ISO 8601, không có timezone trong ví dụ.
- Giá trị `set_id` trong response được chuẩn hóa thành chữ hoa.

### 9. Lấy set theo TCGPlayer ID

- Method: `GET`
- Endpoint: `/sets/tcgplayer/{tcgplayer_id}`
- Mục đích: Lấy một set theo TCGPlayer ID, còn được gọi là `groupID` trong TCGPlayer.

#### Path parameters

| Tên            | Kiểu   | Bắt buộc | Mô tả                                      |
| -------------- | ------ | -------- | ------------------------------------------ |
| `tcgplayer_id` | string | Có       | TCGPlayer ID / TCGPlayer `groupID` của set |

#### Request mẫu

```bash
curl "https://api.riftcodex.com/sets/tcgplayer/24519"
```

#### Response mẫu

Status: `200 OK`

```json
{
  "card_count": 95,
  "cardmarket_id": ["6322", "6483"],
  "id": "69a7184cbddee0883890186a",
  "name": "Riftbound Organized Play Promotional Cards",
  "published_on": "2025-10-31T00:00:00",
  "set_id": "OPP",
  "tcgplayer_id": "24343"
}
```

> Lưu ý: Request mẫu dùng ID `24519`, nhưng response mẫu có `tcgplayer_id` là `24343`. Cần kiểm tra lại bằng response thực tế trước khi dùng làm fixture.

### 10. Lấy set theo Riftcodex ID

- Method: `GET`
- Endpoint: `/sets/{id}`
- Mục đích: Lấy một set theo Riftcodex ID.

#### Path parameters

| Tên  | Kiểu   | Bắt buộc | Mô tả                |
| ---- | ------ | -------- | -------------------- |
| `id` | string | Có       | Riftcodex ID của set |

#### Request mẫu từ tài liệu

```bash
curl "https://api.riftcodex.com/sets/:id"
```

> `:id` chỉ là placeholder và cần được thay bằng Riftcodex ID thật khi gọi API.

#### Response mẫu

Status: `200 OK`

```json
{
  "card_count": 95,
  "cardmarket_id": ["6322", "6483"],
  "id": "69a7184cbddee0883890186a",
  "name": "Riftbound Organized Play Promotional Cards",
  "published_on": "2025-10-31T00:00:00",
  "set_id": "OPP",
  "tcgplayer_id": "24343"
}
```

### 11. Lấy danh sách keyword

- Method: `GET`
- Endpoint: `/index/keywords`
- Mục đích: Lấy danh sách tất cả keyword duy nhất xuất hiện trên các thẻ trong database.
- Tham số: Không có.

#### Request mẫu

```http
GET https://api.riftcodex.com/index/keywords
```

```bash
curl "https://api.riftcodex.com/index/keywords"
```

#### Response mẫu

_Chưa được cung cấp._

#### Khả năng sử dụng

- Dựng autocomplete cho ô tìm kiếm keyword.
- Dựng danh sách bộ lọc keyword mà không cần quét toàn bộ dữ liệu card ở client.

### 12. Lấy danh sách tên thẻ

- Method: `GET`
- Endpoint: `/index/card-names`
- Mục đích: Lấy danh sách tên thẻ xuất hiện trong toàn bộ database.
- Tham số: Không có.

#### Request mẫu

```http
GET https://api.riftcodex.com/index/card-names
```

```bash
curl "https://api.riftcodex.com/index/card-names"
```

#### Response mẫu

_Chưa được cung cấp._

#### Khả năng sử dụng

- Cấp dữ liệu autocomplete cho ô tìm kiếm tên thẻ.
- Sau khi người dùng chọn tên, gọi `/cards/name?exact={name}` để lấy dữ liệu card đầy đủ.

### 13–21. Các index phục vụ bộ lọc card

Tất cả endpoint dưới đây:

- Dùng method `GET`.
- Không có tham số.
- Trả về status `200 OK` khi thành công.
- Có response theo schema `Index`.

| STT | Endpoint                 | Nội dung `values`              |
| --- | ------------------------ | ------------------------------ |
| 13  | `/index/card-types`      | Các loại thẻ có trong database |
| 14  | `/index/card-supertypes` | Các supertype của thẻ          |
| 15  | `/index/domains`         | Các domain của thẻ             |
| 16  | `/index/rarities`        | Các độ hiếm của thẻ            |
| 17  | `/index/artists`         | Các họa sĩ của thẻ             |
| 18  | `/index/energy`          | Các giá trị energy có thể có   |
| 19  | `/index/might`           | Các giá trị might có thể có    |
| 20  | `/index/power`           | Các giá trị power có thể có    |
| 21  | `/index/tags`            | Tất cả tag duy nhất của thẻ    |

#### Request mẫu

```bash
curl "https://api.riftcodex.com/index/card-types"
curl "https://api.riftcodex.com/index/card-supertypes"
curl "https://api.riftcodex.com/index/domains"
curl "https://api.riftcodex.com/index/rarities"
curl "https://api.riftcodex.com/index/artists"
curl "https://api.riftcodex.com/index/energy"
curl "https://api.riftcodex.com/index/might"
curl "https://api.riftcodex.com/index/power"
curl "https://api.riftcodex.com/index/tags"
```

> Lỗi trong tài liệu nguồn: phần `/index/card-supertypes` đưa lệnh curl tới `/index/card-types`. Request đúng được ghi ở trên.

#### Response thực tế của `/index/card-types`

Status: `200 OK`

```json
{
  "total": 6,
  "type": "card_types",
  "values": ["Battlefield", "Gear", "Legend", "Rune", "Spell", "Unit"]
}
```

#### Response thực tế của `/index/card-supertypes`

Status: `200 OK`

```json
{
  "total": 4,
  "type": "card_supertypes",
  "values": ["Basic", "Champion", "Signature", "Token"]
}
```

Response trên thuộc `/index/card-supertypes`; lệnh curl `/index/card-types` hiển thị trong tài liệu nguồn là lỗi sao chép.

#### Response thực tế của `/index/rarities`

Status: `200 OK`

```json
{
  "total": 6,
  "type": "rarities",
  "values": ["Common", "Epic", "Promo", "Rare", "Showcase", "Uncommon"]
}
```

#### Response thực tế của `/index/domains`

Status: `200 OK`

```json
{
  "total": 7,
  "type": "domains",
  "values": ["Body", "Calm", "Chaos", "Colorless", "Fury", "Mind", "Order"]
}
```

#### Khả năng sử dụng

- Khởi tạo các lựa chọn cho bộ lọc tìm kiếm card.
- Dùng `energy`, `might` và `power` từ server để tránh hard-code phạm vi số.
- Dùng các index dạng chuỗi cho dropdown, multi-select hoặc autocomplete.

## Data models

### Card

| Field              | Type             | Bắt buộc | Mô tả                                                      |
| ------------------ | ---------------- | -------- | ---------------------------------------------------------- |
| `id`               | string           | Có       | Định danh Riftcodex duy nhất của thẻ                       |
| `name`             | string           | Có       | Tên thẻ                                                    |
| `riftbound_id`     | string           | Có       | Riftbound ID của thẻ                                       |
| `tcgplayer_id`     | string           | Có       | TCGPlayer ID, còn được gọi là `productID`                  |
| `collector_number` | integer          | Có       | Số thứ tự của thẻ trong set                                |
| `attributes`       | `Attributes`     | Có       | Thuộc tính thẻ, ví dụ energy cost, might, power            |
| `classification`   | `Classification` | Có       | Phân loại thẻ, ví dụ type, supertype, rarity, domain       |
| `text`             | `Text`           | Có       | Nội dung thẻ, gồm rich text, plain text và flavour text    |
| `set`              | `CardSet`        | Có       | Thông tin set, gồm set ID và label                         |
| `media`            | `Media`          | Có       | Thông tin media, gồm URL ảnh, họa sĩ và accessibility text |
| `tags`             | string[]         | Có       | Các tag liên quan, ví dụ `Freljord`, `Noxus`               |
| `orientation`      | string           | Có       | Hướng thẻ: `portrait` hoặc `landscape`                     |
| `metadata`         | `Metadata`       | Có       | Metadata của thẻ                                           |
| `new`              | boolean          | Không    | Trạng thái thẻ mới                                         |

#### Ngữ nghĩa bộ lọc `new`

- `new=true`: Chỉ trả về thẻ mới.
- `new=false`: Chỉ trả về thẻ cũ.
- Không truyền `new`: Trả về cả thẻ mới và thẻ cũ.

Trường này hữu ích trong giai đoạn phát hành set mới.

### PaginatedCards

Schema đã được xác nhận từ `GET /cards?page=1&size=2`:

| Field   | Type     | Bắt buộc | Mô tả                             |
| ------- | -------- | -------- | --------------------------------- |
| `items` | `Card[]` | Có       | Danh sách card của trang hiện tại |
| `total` | integer  | Có       | Tổng số card khớp request         |
| `page`  | integer  | Có       | Trang hiện tại, bắt đầu từ `1`    |
| `size`  | integer  | Có       | Page size được yêu cầu            |
| `pages` | integer  | Có       | Tổng số trang                     |

Với `total=1451` và `size=2`, API trả `pages=726`, tương ứng `ceil(total / size)`.

### Set

Schema suy ra từ các response mẫu của `/sets/set-id/{set_id}`, `/sets/tcgplayer/{tcgplayer_id}` và `/sets/{id}`:

| Field           | Type                       | Quan sát                                        |
| --------------- | -------------------------- | ----------------------------------------------- |
| `id`            | string                     | Riftcodex ID duy nhất của set                   |
| `set_id`        | string                     | Riftbound set ID; response mẫu dùng chữ hoa     |
| `name`          | string                     | Tên đầy đủ của set                              |
| `card_count`    | integer                    | Tổng số thẻ trong set                           |
| `published_on`  | string                     | Ngày giờ phát hành theo ISO 8601                |
| `tcgplayer_id`  | string \| null             | TCGPlayer `groupID`; `null` khi chưa có ánh xạ  |
| `cardmarket_id` | string \| string[] \| null | Một ID, nhiều ID hoặc `null` khi chưa có ánh xạ |

### PaginatedSets

Schema đã được xác nhận từ `GET /sets?page=1&size=10`:

| Field   | Type    | Bắt buộc | Mô tả                                                     |
| ------- | ------- | -------- | --------------------------------------------------------- |
| `items` | `Set[]` | Có       | Danh sách set của trang hiện tại                          |
| `total` | integer | Có       | Tổng số set; response đã kiểm tra trả `8`                 |
| `page`  | integer | Có       | Trang hiện tại, bắt đầu từ `1`                            |
| `size`  | integer | Có       | Page size được yêu cầu, kể cả khi lớn hơn số item thực tế |
| `pages` | integer | Có       | Tổng số trang                                             |

### Index

| Field    | Type                  | Bắt buộc | Mô tả                                         |
| -------- | --------------------- | -------- | --------------------------------------------- |
| `total`  | integer               | Có       | Tổng số giá trị duy nhất của loại index       |
| `type`   | string                | Có       | Loại index, ví dụ `keywords`, `sets`, `types` |
| `values` | (string \| integer)[] | Có       | Danh sách các giá trị duy nhất của index      |

`values` có thể là mảng chuỗi hoặc mảng số tùy endpoint. Các index `energy`, `might`, `power` dự kiến dùng số; cần đối chiếu response thực tế.

### Attributes

| Field    | Type            | Bắt buộc                      | Mô tả                                         |
| -------- | --------------- | ----------------------------- | --------------------------------------------- |
| `energy` | integer \| null | Có trong response đã kiểm tra | Energy cost của thẻ; `null` nếu không áp dụng |
| `might`  | integer \| null | Có trong response đã kiểm tra | Might của thẻ; `null` nếu không áp dụng       |
| `power`  | integer \| null | Có trong response đã kiểm tra | Power của thẻ; `null` nếu không áp dụng       |

### Classification

| Field       | Type           | Bắt buộc                      | Mô tả                                                                |
| ----------- | -------------- | ----------------------------- | -------------------------------------------------------------------- |
| `type`      | string         | Có                            | Loại thẻ, ví dụ `Unit`, `Spell`                                      |
| `supertype` | string \| null | Có trong response đã kiểm tra | Supertype; `null` nếu không áp dụng, ví dụ khác: `Champion`, `Token` |
| `rarity`    | string         | Có                            | Độ hiếm, ví dụ `Common`, `Rare`                                      |
| `domain`    | string[]       | Có                            | Một hoặc nhiều domain, ví dụ `Fury`, `Chaos`                         |

### Text

| Field     | Type           | Bắt buộc                      | Mô tả                             |
| --------- | -------------- | ----------------------------- | --------------------------------- |
| `rich`    | string         | Có                            | Nội dung thẻ có rich formatting   |
| `plain`   | string         | Có                            | Nội dung thẻ dạng plain text      |
| `flavour` | string \| null | Có trong response đã kiểm tra | Flavour text; `null` nếu không có |

### CardSet

| Field    | Type   | Bắt buộc | Mô tả                                                 |
| -------- | ------ | -------- | ----------------------------------------------------- |
| `set_id` | string | Có       | Định danh duy nhất của set, ví dụ `OGN`, `OGS`        |
| `label`  | string | Có       | Tên hiển thị của set, ví dụ `Origins`, `Spiritforged` |

### Media

| Field                | Type   | Bắt buộc | Mô tả                                     |
| -------------------- | ------ | -------- | ----------------------------------------- |
| `image_url`          | string | Có       | URL ảnh thẻ                               |
| `artist`             | string | Có       | Tên họa sĩ                                |
| `accessibility_text` | string | Có       | Nội dung hỗ trợ khả năng tiếp cận của thẻ |

### Metadata

| Field           | Type    | Bắt buộc | Mô tả                                                           |
| --------------- | ------- | -------- | --------------------------------------------------------------- |
| `clean_name`    | string  | Có       | Tên thẻ đã loại bỏ ký tự đặc biệt                               |
| `updated_on`    | string  | Có       | Thời điểm cập nhật gần nhất trong Riftcodex, định dạng ISO 8601 |
| `alternate_art` | boolean | Có       | Thẻ có alternate art hay không                                  |
| `overnumbered`  | boolean | Có       | Thẻ có phải phiên bản overnumbered hay không                    |
| `signature`     | boolean | Có       | Thẻ có phải signature card hay không                            |

## Request reference

### CardSortCategories

Kiểu: `string`

Các giá trị hợp lệ:

- `name`
- `collector_number`
- `public_code`
- `type`
- `supertype`
- `rarity`
- `domain`
- `artist`
- `set_id`
- `set_label`
- `energy`
- `might`
- `power`

## Luồng tích hợp dự kiến

### Scope Ripbao đã chốt

Ripbao chỉ cần:

1. Hiển thị danh sách card.
2. Hiển thị ảnh và tên card.
3. Giữ `tcgplayer_id` để ghép giá từ nguồn TCGPlayer.
4. Lọc theo domain, card type và card supertype.

Không cần dùng toàn bộ nội dung chi tiết như rules text, flavour text, attributes, tags, artist hoặc metadata trong UI hiện tại.

#### Application model tối thiểu

```ts
type RipbaoCard = {
  id: string;
  name: string;
  tcgplayerId: string;
  imageUrl: string;
  domain: string[];
  type: string;
  supertype: string | null;
};
```

Mapping từ Riftcodex:

```ts
const card: RipbaoCard = {
  id: item.id,
  name: item.name,
  tcgplayerId: item.tcgplayer_id,
  imageUrl: item.media.image_url,
  domain: item.classification.domain,
  type: item.classification.type,
  supertype: item.classification.supertype,
};
```

Riftcodex chỉ cung cấp `tcgplayer_id` (`productID`) trong các API đã ghi nhận. Giá card cần được lấy từ API hoặc nguồn dữ liệu TCGPlayer riêng rồi join theo ID này.

### Khởi tạo bộ lọc

```text
/sets
  └─ danh sách set

/index/*
  └─ types, supertypes, domains, rarities, artists,
     energy, might, power, tags, keywords, card names
```

Các index phù hợp để nạp và cache trước nhằm dựng dropdown, multi-select và autocomplete.

### Duyệt và tìm card

```text
Duyệt toàn bộ              → GET /cards
Tìm trong nội dung thẻ     → GET /cards/search?query=...
Tìm theo tên               → GET /cards/name?exact=... hoặc ?fuzzy=...
Mở chi tiết                → GET /cards/{id}
Đối chiếu mã Riftbound     → GET /cards/riftbound/{id}
Đối chiếu TCGPlayer        → GET /cards/tcgplayer/{productID}
```

### Tra cứu set

```text
Theo Riftbound set ID      → GET /sets/set-id/{set_id}
Theo TCGPlayer groupID     → GET /sets/tcgplayer/{groupID}
Theo Riftcodex ID          → GET /sets/{id}
```

### API nên dùng trong ứng dụng

- Cốt lõi: `/cards` để lấy danh sách card có phân trang.
- Tìm theo tên: `/cards/name` chỉ khi UI có search box.
- Bộ lọc động trong scope hiện tại: `/index/domains`, `/index/card-types`, `/index/card-supertypes`.
- Không cần cho scope hiện tại: `/cards/search`, `/cards/{id}`, `/cards/riftbound/{id}`, `/cards/tcgplayer/{id}`, toàn bộ `/sets`, và các index còn lại.
- Ghép giá: lấy `tcgplayer_id` ngay từ item của `/cards`, không cần gọi lại `/cards/tcgplayer/{id}`.

## Response cần lấy để kiểm tra model

Với scope Ripbao hiện tại, response `/cards`, `/cards/name`, `/index/domains`, `/index/card-types` và `/index/card-supertypes` đã đủ để xây UI danh sách, tìm tên và filter. Không cần gọi thêm API Riftcodex để kiểm tra model.

### Ưu tiên 1 — bắt buộc

1. `/cards?page=1&size=2` — kiểm tra pagination envelope và model `Card` đầy đủ.
2. `/cards/{id}` — kiểm tra single-card response có object trực tiếp hay wrapper.
3. `/cards/riftbound/ogn-011` — kiểm tra partial match trả mảng, object hay pagination.
4. `/sets?page=1&size=2` — kiểm tra pagination envelope và model `Set`.
5. `/index/domains`, `/index/card-types`, `/index/card-supertypes` — đã xác nhận schema và giá trị thực tế.

### Ưu tiên 2 — kiểm tra biến thể

6. `/cards/name?exact=master+yi+honed&size=2`.
7. `/cards/name?fuzzy=yi+hone&size=2`.
8. `/cards/search?query=draw&page=1&size=2` — chỉ cần nếu sẽ dùng full-text search.
9. `/index/card-names` — chỉ cần nếu dùng autocomplete tên thẻ.
10. `/cards/tcgplayer/652782` — xác nhận lookup TCGPlayer trả một hay nhiều card.

### Ưu tiên 3 — lỗi và edge case

11. Một Riftcodex card ID không tồn tại.
12. Một Riftbound ID không tồn tại.
13. `/cards/name` không có `exact`/`fuzzy`, và có cả hai tham số cùng lúc.
14. `/sets/tcgplayer/24519` — kiểm tra bất nhất ID trong tài liệu mẫu.

Khi gửi response, nên kèm URL đã gọi, HTTP status và JSON body. Header chỉ cần gửi nếu response phân trang dùng thông tin trong header.

## Điểm cần xác minh

- Response schema và cấu trúc phân trang của `/cards/search`; `/cards` và fuzzy `/cards/name` đã được xác nhận dùng `PaginatedCards`.
- Xác nhận giới hạn thực tế của `size` trên `/cards`; response đã xác nhận `page` và `size` hoạt động.
- Hành vi khi truyền đồng thời cả `exact` và `fuzzy`, hoặc không truyền tham số nào.
- Response và HTTP status khi Riftcodex ID không tồn tại hoặc sai định dạng.
- Cấu trúc response của `/cards/riftbound/{id}` khi khớp một phần trả về nhiều phiên bản.
- Response và HTTP status khi Riftbound ID hoặc TCGPlayer ID không tồn tại.
- `/sets` đã được xác nhận dùng `PaginatedSets`; cần quyết định có chuẩn hóa `cardmarket_id` thành mảng trong application model hay giữ nguyên union từ API.
- Xác minh request `/sets/tcgplayer/24519` có thực sự tương ứng với response chứa `tcgplayer_id: "24343"` hay chỉ là response mẫu dùng chung.
- Response và HTTP status khi set ID không tồn tại hoặc sai định dạng.
- Xác nhận `/index/keywords` và `/index/card-names` cũng dùng schema `Index` như nhóm endpoint index còn lại.
- `/index/card-names` có loại bỏ tên trùng lặp giữa các phiên bản thẻ hay không.
- Kiểu phần tử thực tế của các index ngoài scope như `/index/energy`, `/index/might` và `/index/power` chưa cần xác minh.
