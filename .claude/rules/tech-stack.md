# 🛠️ Quy tắc: Tech Stack

## Backend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Node.js | ≥ 18 LTS | Runtime |
| NestJS | ^10.0 | Web framework |
| TypeScript | ^5.0 | Type safety |
| Mongoose | ^8.0 | MongoDB ODM |
| MongoDB | ^7.0 | Primary database (Replica Set bắt buộc) |
| Redis | ^7.0 | Cache, session, rate limit, pub/sub |
| BullMQ | ^5.0 | Job queue |
| Socket.IO | ^4.0 | Realtime |
| Passport.js | ^0.7 | Authentication |
| bcrypt | ^5.0 | Password hashing |
| class-validator | ^0.14 | DTO validation |
| class-transformer | ^0.5 | Transform DTO |
| @nestjs/throttler | ^6.0 | Rate limiting |

## Frontend

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| React | ^18.0 | UI framework |
| TypeScript | ^5.0 | Type safety |
| Redux Toolkit | ^2.0 | State management |
| TanStack Query | ^5.0 | Server state, caching |
| React Router | ^6.0 | Routing |
| Socket.IO Client | ^4.0 | Realtime |
| React Hook Form | ^7.0 | Form management |
| Zod | ^3.0 | Schema validation |
| Axios | ^1.0 | HTTP client |
| Vite | ^5.0 | Build tool |

## DevOps

| Công nghệ | Phiên bản | Mục đích |
|---|---|---|
| Docker | ^25.0 | Container |
| Docker Compose | ^2.0 | Multi-container |
| GitHub Actions | - | CI/CD |
| Jest | ^29.0 | Testing |
| Cypress | ^13.0 | E2E testing |

## Nguyên tắc Cập nhật Dependencies

- Cập nhật minor/patch thường xuyên (theo sprint)
- Cập nhật major: đánh giá kỹ, tạo ADR nếu ảnh hưởng lớn
- Không dùng `latest` tag trong production Docker image
- Pin exact version trong `package-lock.json`
- Kiểm tra security audit: `npm audit` trước mỗi release

## Không được Dùng

- jQuery (dùng React)
- Sequelize/TypeORM (dùng Mongoose)
- Express thuần (dùng NestJS)
- moment.js (dùng date-fns hoặc Day.js)
- localStorage cho token (dùng HttpOnly Cookie + memory)
