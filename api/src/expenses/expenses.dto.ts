import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { CATEGORIES, Category, Status, STATUSES } from './expense.rules';

export class CreateExpenseDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(10_000_000)
  amount: number;

  @IsIn(CATEGORIES)
  category: Category;
}

export class ListQueryDto {
  @IsOptional()
  @IsIn(STATUSES)
  status?: Status;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 10;
}

export class RejectDto {
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason: string;
}
