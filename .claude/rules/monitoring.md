# 📊 Quy tắc: Monitoring

## Các Metric Quan trọng Cần Theo dõi

### Application Metrics
- **Request Rate**: số request/giây theo endpoint
- **Error Rate**: tỷ lệ 4xx, 5xx theo endpoint
- **Response Time**: p50, p95, p99
- **Transaction Success Rate**: tỷ lệ giao dịch thành công
- **Active WebSocket Connections**: số kết nối socket đang mở

### Infrastructure Metrics
- **CPU Usage**: alert khi > 80%
- **Memory Usage**: alert khi > 85%
- **Disk Usage**: alert khi > 80%
- **MongoDB Connection Pool**: alert khi saturation > 90%
- **Redis Memory**: alert khi > 70%
- **BullMQ Queue Size**: alert khi queue > 1000 jobs

## Alert Rules

| Metric | Threshold | Action |
|---|---|---|
| Error Rate | > 1% trong 5 phút | Slack alert #incidents |
| Response Time p95 | > 1s | Slack alert #monitoring |
| Transaction Failure | > 5% trong 1 phút | PagerDuty (P2) |
| System Down | Health check fail 3 lần | PagerDuty (P1) |
| Disk Usage | > 80% | Email alert |

## Logging

### Log Levels
```typescript
// ERROR – lỗi cần can thiệp ngay
logger.error('Transaction failed', { txId, error });

// WARN – bất thường nhưng không ảnh hưởng nghiêm trọng
logger.warn('Rate limit approaching for user', { userId });

// INFO – hoạt động bình thường quan trọng
logger.log('Transfer completed', { txId, amount, from, to });

// DEBUG – chi tiết để debug (không dùng production)
logger.debug('JWT payload', { payload });
```

### Structured Logging Format
```json
{
  "timestamp": "2025-01-15T08:30:00Z",
  "level": "info",
  "service": "hki-wallet-backend",
  "requestId": "req_abc123",
  "userId": "user_xyz",
  "action": "TRANSFER",
  "message": "Transfer completed",
  "data": {
    "txId": "tx_001",
    "amount": 50000
  }
}
```

## Health Check Endpoint

```typescript
// GET /api/health
{
  "status": "ok",
  "timestamp": "2025-01-15T08:30:00Z",
  "services": {
    "database": "ok",
    "redis": "ok",
    "queue": "ok"
  }
}
```

## Dashboards Grafana

- **Overview Dashboard**: tổng quan hệ thống
- **Transaction Dashboard**: giao dịch theo thời gian
- **Error Dashboard**: phân tích lỗi
- **Infrastructure Dashboard**: CPU, memory, disk
