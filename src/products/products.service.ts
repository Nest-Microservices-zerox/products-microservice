import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from 'src/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService {

  constructor(private prisma: PrismaService) {}
  
  async create(createProductDto: CreateProductDto) {
    const product = await this.prisma.product.create({
      data: createProductDto
    });

    return product;
  }

  async findAll( paginationDto:PaginationDto ) {
    
    const { page, limit } = paginationDto;

    const totalPages = await this.prisma.product.count({ where: { available: true } });
    const lastPage = Math.ceil( totalPages/limit!);

    return {
      data: await this.prisma.product.findMany({
      skip: ( page! - 1) * limit!,
      take: limit,
      where: { 
        available: true
      }
    }),
    meta: {
      lastPage: lastPage,
      page: page,
      total: totalPages
    }
    }
  }

  async findOne(id: number) {
    
    const product = await this.prisma.product.findFirst({
      where: { id: id, available: true }
    });

    if (!product) {
      throw new RpcException({
        message: `Product with id #${id} not found`,
        status: HttpStatus.BAD_REQUEST
      });
    }

    return product
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const {id: _, ...data} = updateProductDto;

    await this.findOne(id);
    
    
    return this.prisma.product.update({
      where: {id},
      data: data
    });
  }
  
  async remove(id: number) {
    await this.findOne(id);

    // return this.prisma.product.delete({
    //   where: { id }
    // });

    const product = await this.prisma.product.update({
      where: {id},
      data: {
        available: false
      }
    });

    return product;
  }
}
