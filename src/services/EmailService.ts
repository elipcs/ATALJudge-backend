/**
 * @module services/EmailService
 * @description Service for sending email notifications and communications.
 * 
 * Handles email templates and SMTP delivery.
 */

import { injectable } from 'tsyringe';
import * as nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils';

/**
 * Service for email notifications.
 * @class EmailService
 */
@injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, 
      auth: config.email.username && config.email.password ? {
        user: config.email.username,
        pass: config.email.password,
      } : undefined,
    });

    if (config.nodeEnv === 'development') {
      this.transporter.verify((error, _success) => {
        if (error) {
          logger.warn('[EMAIL] Error connecting to email server', { error: error.message });
        } else {
          logger.info('[EMAIL] Email server ready to send messages');
        }
      });
    }
  }

  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<void> {
    const resetUrl = `${config.frontendUrl}/reset-senha?token=${resetToken}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset de Senha - AtalJudge</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #ddd;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #2c3e50;
            margin: 0;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #2980b9;
          }
          .footer {
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
            margin-top: 20px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset</h1>
          </div>
          
          <div class="content">
            <p>Hello, <strong>${name}</strong>!</p>
            
            <p>We received a request to reset the password for your <strong>AtalJudge</strong> account.</p>
            
            <p>Click the button below to create a new password:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 3px;">
              ${resetUrl}
            </p>
            
            <div class="warning">
              <strong>Important:</strong>
              <ul style="margin: 5px 0;">
                <li>This link is valid for <strong>1 hour</strong></li>
                <li>Can only be used <strong>once</strong></li>
                <li>If you did not request this reset, please ignore this email</li>
              </ul>
            </div>
          </div>
          
          <div class="footer">
            <p>This is an automated email, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} AtalJudge. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Hello, ${name}!

We received a request to reset the password for your AtalJudge account.

To create a new password, access the link below:
${resetUrl}

IMPORTANT:
- This link is valid for 1 hour
- Can only be used once
- If you did not request this reset, please ignore this email

This is an automated email, please do not reply.

© ${new Date().getFullYear()} AtalJudge. All rights reserved.
    `;

    try {
      await this.transporter.sendMail({
        from: `"AtalJudge" <${config.email.from}>`,
        to: email,
        subject: 'Password Reset - AtalJudge',
        text: textContent,
        html: htmlContent,
      });

      logger.info('[EMAIL] Password reset email sent successfully', { email });
    } catch (error) {
      logger.error('[EMAIL] Error sending password reset email', { 
        email, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new Error('Error sending email. Please try again later.');
    }
  }

  async sendPasswordResetConfirmation(email: string, name: string): Promise<void> {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Senha Alterada - AtalJudge</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            border: 1px solid #ddd;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #27ae60;
            margin: 0;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .success-icon {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
            margin-top: 20px;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 10px;
            margin: 15px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Senha Alterada com Sucesso</h1>
          </div>
          
          <div class="content">
            <div class="success-icon"></div>
            
            <p>Olá, <strong>${name}</strong>!</p>
            
            <p>Sua senha foi alterada com sucesso no <strong>AtalJudge</strong>.</p>
            
            <p>Agora você já pode fazer login com sua nova senha.</p>
            
            <div class="warning">
              <strong>Você não reconhece esta ação?</strong>
              <p style="margin: 5px 0;">
                Se você não alterou sua senha, entre em contato com o suporte imediatamente.
                Sua conta pode ter sido comprometida.
              </p>
            </div>
          </div>
          
          <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; ${new Date().getFullYear()} AtalJudge. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const textContent = `
Olá, ${name}!

Sua senha foi alterada com sucesso no AtalJudge.

Agora você já pode fazer login com sua nova senha.

VOCÊ NÃO RECONHECE ESTA AÇÃO?
Se você não alterou sua senha, entre em contato com o suporte imediatamente.
Sua conta pode ter sido comprometida.

Este é um email automático, por favor não responda.

© ${new Date().getFullYear()} AtalJudge. Todos os direitos reservados.
    `;

    try {
      await this.transporter.sendMail({
        from: `"AtalJudge" <${config.email.from}>`,
        to: email,
        subject: 'Senha Alterada - AtalJudge',
        text: textContent,
        html: htmlContent,
      });

      logger.info('[EMAIL] Email de confirmação de reset enviado com sucesso', { email });
    } catch (error) {
      logger.error('[EMAIL] Erro ao enviar email de confirmação', { 
        email, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      });
      
    }
  }
}

