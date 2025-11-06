import { injectable } from 'tsyringe';
import { BaseRepository } from './BaseRepository';
import { AllowedIP } from '../models/AllowedIP';

@injectable()
export class AllowedIPRepository extends BaseRepository<AllowedIP> {
  constructor() {
    super(AllowedIP);
  }

  async findByIP(ip: string): Promise<AllowedIP | null> {
    return this.repository.findOne({ where: { ip } });
  }

  async findActiveIPs(): Promise<AllowedIP[]> {
    return this.repository.find({ where: { active: true } });
  }

  async isIPAllowed(ip: string): Promise<boolean> {
    const allowedIP = await this.repository.findOne({
      where: { ip, active: true }
    });
    return !!allowedIP;
  }

  async toggleIPStatus(id: string): Promise<AllowedIP | null> {
    const ip = await this.repository.findOne({ where: { id } });
    if (!ip) return null;

    ip.active = !ip.active;
    return this.repository.save(ip);
  }
}
