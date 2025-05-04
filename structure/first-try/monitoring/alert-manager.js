// monitoring/alert-manager.js

const nodemailer = require('nodemailer');

class AlertManager {
  constructor(config) {
    this.config = config;
    this.emailTransporter = nodemailer.createTransport(config.email);
    this.alertThresholds = config.thresholds;
    this.activeAlerts = new Map();
  }

  async checkMetricsAndAlert(metrics) {
    const alerts = [];

    // Проверка времени ответа БД
    if (metrics.databases) {
      for (const [db, health] of Object.entries(metrics.databases)) {
        if (health.responseTime > this.alertThresholds.responseTime[db]) {
          alerts.push({
            type: 'high_response_time',
            database: db,
            value: health.responseTime,
            threshold: this.alertThresholds.responseTime[db],
            severity: 'warning'
          });
        }

        if (health.status === 'unhealthy') {
          alerts.push({
            type: 'database_down',
            database: db,
            error: health.error,
            severity: 'critical'
          });
        }
      }
    }

    // Проверка ошибок синхронизации
    if (metrics.syncErrors > this.alertThresholds.syncErrors) {
      alerts.push({
        type: 'high_sync_errors',
        value: metrics.syncErrors,
        threshold: this.alertThresholds.syncErrors,
        severity: 'warning'
      });
    }

    // Проверка проблем целостности данных
    if (metrics.integrityIssues) {
      if (metrics.integrityIssues.critical > 0) {
        alerts.push({
          type: 'critical_integrity_issues',
          value: metrics.integrityIssues.critical,
          severity: 'critical'
        });
      }
    }

    // Отправка алертов
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  async sendAlert(alert) {
    const alertKey = `${alert.type}-${alert.database || 'general'}`;
    
    // Проверка, не отправляли ли мы этот алерт недавно
    if (this.activeAlerts.has(alertKey)) {
      const lastAlert = this.activeAlerts.get(alertKey);
      if (Date.now() - lastAlert.timestamp < this.config.alertCooldown) {
        return; // Пропускаем повторный алерт
      }
    }

    // Отправка email
    if (alert.severity === 'critical') {
      await this.sendEmail(alert);
    }

    // Отправка в Slack
    if (this.config.slack.enabled) {
      await this.sendSlackAlert(alert);
    }

    // Запись в лог
    console.error('ALERT:', alert);

    // Обновление активных алертов
    this.activeAlerts.set(alertKey, {
      alert,
      timestamp: Date.now()
    });
  }

  async sendEmail(alert) {
    const mailOptions = {
      from: this.config.email.from,
      to: this.config.email.to,
      subject: `[${alert.severity.toUpperCase()}] Database Alert: ${alert.type}`,
      html: this.formatAlertEmail(alert)
    };

    try {
      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send alert email:', error);
    }
  }

  async sendSlackAlert(alert) {
    const webhookUrl = this.config.slack.webhookUrl;
    const message = {
      text: `*${alert.severity.toUpperCase()} ALERT*: ${alert.type}`,
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        fields: [
          {
            title: 'Type',
            value: alert.type,
            short: true
          },
          {
            title: 'Database',
            value: alert.database || 'N/A',
            short: true
          },
          {
            title: 'Value',
            value: alert.value ? alert.value.toString() : 'N/A',
            short: true
          },
          {
            title: 'Threshold',
            value: alert.threshold ? alert.threshold.toString() : 'N/A',
            short: true
          }
        ],
        footer: 'Database Monitoring System',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  formatAlertEmail(alert) {
    return `
      <h2>Database Alert</h2>
      <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
      <p><strong>Type:</strong> ${alert.type}</p>
      <p><strong>Database:</strong> ${alert.database || 'N/A'}</p>
      <p><strong>Value:</strong> ${alert.value || 'N/A'}</p>
      <p><strong>Threshold:</strong> ${alert.threshold || 'N/A'}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      ${alert.error ? `<p><strong>Error:</strong> ${alert.error}</p>` : ''}
      
      <hr>
      <p>This is an automated alert from the Database Monitoring System.</p>
    `;
  }
}

module.exports = AlertManager;
