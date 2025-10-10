import { Injectable } from '@nestjs/common';
import { LoggingUtil } from '../../../common/utils/logging.util';
import { DateUtils } from '../../../common/utils/date.utils';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { TaxReportDocument } from '../../../database/schemas/tax-report.schema';
import { TaxJurisdictionDocument } from '../../../database/schemas/tax-jurisdiction.schema';

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'xlsx',
  CSV = 'csv',
}

export interface ReportGenerationResult {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  fileSize: number;
}

@Injectable()
export class TaxReportGeneratorService {
  /**
   * Generate report in the specified format
   */
  async generateReport(
    report: TaxReportDocument,
    jurisdiction: TaxJurisdictionDocument,
    format: ReportFormat,
  ): Promise<ReportGenerationResult> {
    LoggingUtil.log(`Generating ${format} report for ${report.reportId}`);

    switch (format) {
      case ReportFormat.PDF:
        return this.generatePDFReport(report, jurisdiction);
      case ReportFormat.EXCEL:
        return this.generateExcelReport(report, jurisdiction);
      case ReportFormat.CSV:
        return this.generateCSVReport(report, jurisdiction);
      default:
        throw new Error(`Unsupported report format: ${String(format)}`);
    }
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(
    report: TaxReportDocument,
    jurisdiction: TaxJurisdictionDocument,
  ): Promise<ReportGenerationResult> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => buffers.push(chunk));

        doc.on('end', () => {
          const buffer = Buffer.concat(buffers);
          resolve({
            buffer,
            fileName: `tax-report-${report.reportId}.pdf`,
            mimeType: 'application/pdf',
            fileSize: buffer.length,
          });
        });

        // Header

        doc.fontSize(20).text('Tax Report', { align: 'center' });

        doc.moveDown();

        // Report Info

        doc.fontSize(14).text(`Report ID: ${report.reportId}`);

        doc.text(`Jurisdiction: ${jurisdiction.name}`);

        doc.text(
          `Period: ${DateUtils.format(report.periodStart, 'MMM DD, YYYY')} - ${DateUtils.format(report.periodEnd, 'MMM DD, YYYY')}`,
        );

        doc.text(`Reporting Period: ${report.reportingPeriod}`);

        doc.text(`Generated: ${DateUtils.format(DateUtils.now(), 'MMM DD, YYYY')}`);

        doc.moveDown();

        // Summary

        doc.fontSize(16).text('Summary', { underline: true });

        doc.fontSize(12);

        doc.text(`Total Tax Collected: ${report.currency} ${report.totalTaxCollected.toFixed(2)}`);

        doc.text(`Total Tax Remitted: ${report.currency} ${report.totalTaxRemitted.toFixed(2)}`);

        doc.text(`Total Tax Owed: ${report.currency} ${report.totalTaxOwed.toFixed(2)}`);

        doc.text(`Number of Bookings: ${report.numberOfBookings}`);

        doc.text(`Number of Properties: ${report.numberOfProperties}`);

        doc.text(`Number of Hosts: ${report.numberOfHosts}`);

        doc.moveDown();

        // Tax Breakdown
        if (report.taxBreakdown && report.taxBreakdown.length > 0) {
          doc.fontSize(16).text('Tax Breakdown by Type', { underline: true });

          doc.fontSize(12);

          const table = {
            headers: ['Tax Type', 'Collected', 'Remitted', 'Owed', 'Bookings'],
            rows: report.taxBreakdown.map((item) => [
              item.taxType,
              `${report.currency} ${item.taxCollected.toFixed(2)}`,
              `${report.currency} ${item.taxRemitted.toFixed(2)}`,
              `${report.currency} ${item.taxOwed.toFixed(2)}`,
              item.numberOfBookings.toString(),
            ]),
          };

          // Draw table
          const startX = 50;

          let startY = doc.y;
          const columnWidths = [100, 80, 80, 80, 60];
          const rowHeight = 20;

          // Headers

          doc

            .rect(
              startX,
              startY,
              columnWidths.reduce((sum, w) => sum + w, 0),
              rowHeight,
            )

            .stroke();
          let currentX = startX;
          table.headers.forEach((header, index) => {
            doc.text(header, currentX + 5, startY + 5, { width: columnWidths[index] - 10 });
            currentX += columnWidths[index];
          });
          startY += rowHeight;

          // Rows
          table.rows.forEach((row) => {
            doc

              .rect(
                startX,
                startY,
                columnWidths.reduce((sum, w) => sum + w, 0),
                rowHeight,
              )

              .stroke();
            currentX = startX;
            row.forEach((cell, index) => {
              doc.text(cell, currentX + 5, startY + 5, { width: columnWidths[index] - 10 });
              currentX += columnWidths[index];
            });
            startY += rowHeight;
          });
        }

        doc.end();
      } catch (error) {
        reject(error instanceof Error ? error : new Error('PDF generation failed'));
      }
    });
  }

  /**
   * Generate Excel report
   */
  private async generateExcelReport(
    report: TaxReportDocument,
    jurisdiction: TaxJurisdictionDocument,
  ): Promise<ReportGenerationResult> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tax Report');

    // Report Info
    worksheet.addRow(['Tax Report']);
    worksheet.addRow(['Report ID', report.reportId]);
    worksheet.addRow(['Jurisdiction', jurisdiction.name]);
    worksheet.addRow([
      'Period',
      `${DateUtils.format(report.periodStart, 'MMM DD, YYYY')} - ${DateUtils.format(report.periodEnd, 'MMM DD, YYYY')}`,
    ]);
    worksheet.addRow(['Reporting Period', report.reportingPeriod]);
    worksheet.addRow(['Generated', DateUtils.format(DateUtils.now(), 'MMM DD, YYYY')]);
    worksheet.addRow([]);

    // Summary
    worksheet.addRow(['Summary']);
    worksheet.addRow([
      'Total Tax Collected',
      `${report.currency} ${report.totalTaxCollected.toFixed(2)}`,
    ]);
    worksheet.addRow([
      'Total Tax Remitted',
      `${report.currency} ${report.totalTaxRemitted.toFixed(2)}`,
    ]);
    worksheet.addRow(['Total Tax Owed', `${report.currency} ${report.totalTaxOwed.toFixed(2)}`]);
    worksheet.addRow(['Number of Bookings', report.numberOfBookings]);
    worksheet.addRow(['Number of Properties', report.numberOfProperties]);
    worksheet.addRow(['Number of Hosts', report.numberOfHosts]);
    worksheet.addRow([]);

    // Tax Breakdown
    if (report.taxBreakdown && report.taxBreakdown.length > 0) {
      worksheet.addRow(['Tax Breakdown by Type']);
      worksheet.addRow([
        'Tax Type',
        'Tax Collected',
        'Tax Remitted',
        'Tax Owed',
        'Number of Bookings',
        'Average Tax Rate',
      ]);

      report.taxBreakdown.forEach((item) => {
        worksheet.addRow([
          item.taxType,
          item.taxCollected,
          item.taxRemitted,
          item.taxOwed,
          item.numberOfBookings,
          item.averageTaxRate,
        ]);
      });
    }

    // Style the worksheet
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(8).font = { bold: true, size: 14 };
    worksheet.getRow(16).font = { bold: true, size: 14 };
    worksheet.getRow(17).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();

    return {
      buffer: Buffer.from(buffer),
      fileName: `tax-report-${report.reportId}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileSize: buffer.byteLength,
    };
  }

  /**
   * Generate CSV report
   */
  private async generateCSVReport(
    report: TaxReportDocument,
    jurisdiction: TaxJurisdictionDocument,
  ): Promise<ReportGenerationResult> {
    return new Promise((resolve, reject) => {
      try {
        const csvData: (string | number)[][] = [];

        // Report Info
        csvData.push(['Tax Report']);
        csvData.push(['Report ID', report.reportId]);
        csvData.push(['Jurisdiction', jurisdiction.name]);
        csvData.push([
          'Period',
          `${DateUtils.format(report.periodStart, 'MMM DD, YYYY')} - ${DateUtils.format(report.periodEnd, 'MMM DD, YYYY')}`,
        ]);
        csvData.push(['Reporting Period', report.reportingPeriod]);
        csvData.push(['Generated', DateUtils.format(DateUtils.now(), 'MMM DD, YYYY')]);
        csvData.push([]);

        // Summary
        csvData.push(['Summary']);
        csvData.push([
          'Total Tax Collected',
          `${report.currency} ${report.totalTaxCollected.toFixed(2)}`,
        ]);
        csvData.push([
          'Total Tax Remitted',
          `${report.currency} ${report.totalTaxRemitted.toFixed(2)}`,
        ]);
        csvData.push(['Total Tax Owed', `${report.currency} ${report.totalTaxOwed.toFixed(2)}`]);
        csvData.push(['Number of Bookings', report.numberOfBookings]);
        csvData.push(['Number of Properties', report.numberOfProperties]);
        csvData.push(['Number of Hosts', report.numberOfHosts]);
        csvData.push([]);

        // Tax Breakdown
        if (report.taxBreakdown && report.taxBreakdown.length > 0) {
          csvData.push(['Tax Breakdown by Type']);
          csvData.push([
            'Tax Type',
            'Tax Collected',
            'Tax Remitted',
            'Tax Owed',
            'Number of Bookings',
            'Average Tax Rate',
          ]);

          report.taxBreakdown.forEach((item) => {
            csvData.push([
              item.taxType,
              item.taxCollected,
              item.taxRemitted,
              item.taxOwed,
              item.numberOfBookings,
              item.averageTaxRate,
            ]);
          });
        }

        // Convert to CSV string
        const csvString = csvData
          .map((row) =>
            row
              .map((cell) =>
                typeof cell === 'string' && cell.includes(',')
                  ? `"${cell.replace(/"/g, '""')}"`
                  : String(cell),
              )
              .join(','),
          )
          .join('\n');

        const buffer = Buffer.from(csvString, 'utf8');

        resolve({
          buffer,
          fileName: `tax-report-${report.reportId}.csv`,
          mimeType: 'text/csv',
          fileSize: buffer.length,
        });
      } catch (error) {
        reject(error instanceof Error ? error : new Error('CSV generation failed'));
      }
    });
  }
}
