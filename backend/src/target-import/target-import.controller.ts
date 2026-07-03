import { BadRequestException, Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { TargetImportService } from './target-import.service';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@ApiTags('target-import')
@Controller('target-plans/:id/import')
export class TargetImportController {
  constructor(private readonly targetImportService: TargetImportService) {}

  @Post()
  @ApiOperation({ summary: "Import target values from an XLSX file into a plan's target lines (upserts)" })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // buffer only — never written to disk
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
    }),
  )
  async import(@Param('id') planId: string, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded (expected multipart field "file")');
    }
    const isXlsx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.originalname.toLowerCase().endsWith('.xlsx');
    if (!isXlsx) {
      throw new BadRequestException('Only .xlsx files are supported');
    }

    return this.targetImportService.importFile(planId, file.originalname, file.buffer);
  }
}
