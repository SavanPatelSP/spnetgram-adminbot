import { PrismaService } from './prisma.service.js'
import type { PrismaClient } from '@prisma/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaDelegate = { [K: string]: any }

export abstract class BaseRepository<TDelegate extends PrismaDelegate, TModel> {
  protected readonly prisma: PrismaClient
  protected abstract delegate: TDelegate

  constructor() {
    this.prisma = PrismaService.getInstance().client
  }

  protected get db(): TDelegate {
    return this.delegate
  }

  async findUnique(args: Parameters<TDelegate['findUnique']>[0]): Promise<TModel | null> {
    return (this.delegate as any).findUnique(args)
  }

  async findMany(args?: Parameters<TDelegate['findMany']>[0]): Promise<TModel[]> {
    return (this.delegate as any).findMany(args ?? {})
  }

  async findFirst(args: Parameters<TDelegate['findFirst']>[0]): Promise<TModel | null> {
    return (this.delegate as any).findFirst(args)
  }

  async create(args: Parameters<TDelegate['create']>[0]): Promise<TModel> {
    return (this.delegate as any).create(args)
  }

  async update(args: Parameters<TDelegate['update']>[0]): Promise<TModel> {
    return (this.delegate as any).update(args)
  }

  async upsert(args: Parameters<TDelegate['upsert']>[0]): Promise<TModel> {
    return (this.delegate as any).upsert(args)
  }

  async delete(args: Parameters<TDelegate['delete']>[0]): Promise<TModel> {
    return (this.delegate as any).delete(args)
  }

  async count(args?: Parameters<TDelegate['count']>[0]): Promise<number> {
    return (this.delegate as any).count(args ?? {})
  }
}
