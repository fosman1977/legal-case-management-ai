
/**
 * Advanced Table Extraction Module
 */

class TableExtractor {
  constructor() {
    this.minTableRows = 2;
    this.minTableCols = 2;
    this.pdfjsLib = null;
  }

  async init() {
    if (!this.pdfjsLib) {
      this.pdfjsLib = await import('pdfjs-dist');
    }
    return this.pdfjsLib;
  }
  
  async extractFromPage(pdfPath, pageNum) {
    const tables = [];
    
    try {
      const pdfjsLib = await this.init();
      
      // Load PDF page
      const pdf = await pdfjsLib.getDocument(pdfPath).promise;
      const page = await pdf.getPage(pageNum);
      
      // Get page operators for line detection
      const ops = await page.getOperatorList();
      
      // Detect table structures
      const tableRegions = this.detectTableRegions(ops);
      
      // Extract content from each table
      for (const region of tableRegions) {
        const table = await this.extractTableContent(page, region);
        if (table && table.rows.length >= this.minTableRows) {
          tables.push(table);
        }
      }
      
      pdf.destroy();
      
    } catch (error) {
      console.error(`Table extraction error on page ${pageNum}:`, error);
    }
    
    return tables;
  }
  
  detectTableRegions(ops) {
    const regions = [];
    const lines = this.extractLines(ops);
    
    // Group intersecting lines into potential tables
    const horizontalLines = lines.filter(l => l.type === 'horizontal');
    const verticalLines = lines.filter(l => l.type === 'vertical');
    
    // Find grid patterns
    const grids = this.findGridPatterns(horizontalLines, verticalLines);
    
    for (const grid of grids) {
      if (grid.rows >= this.minTableRows && grid.cols >= this.minTableCols) {
        regions.push({
          bbox: grid.bbox,
          rows: grid.rows,
          cols: grid.cols,
          lines: grid.lines
        });
      }
    }
    
    return regions;
  }
  
  extractLines(ops) {
    const lines = [];
    const { fnArray, argsArray } = ops;
    
    let currentX = 0, currentY = 0;
    
    for (let i = 0; i < fnArray.length; i++) {
      const fn = fnArray[i];
      const args = argsArray[i];
      
      // OPS.moveTo
      if (fn === 13) {
        currentX = args[0];
        currentY = args[1];
      }
      // OPS.lineTo
      else if (fn === 14) {
        const line = {
          x1: currentX,
          y1: currentY,
          x2: args[0],
          y2: args[1]
        };
        
        // Classify line type
        if (Math.abs(line.y1 - line.y2) < 1) {
          line.type = 'horizontal';
        } else if (Math.abs(line.x1 - line.x2) < 1) {
          line.type = 'vertical';
        }
        
        lines.push(line);
        currentX = args[0];
        currentY = args[1];
      }
    }
    
    return lines;
  }
  
  findGridPatterns(horizontalLines, verticalLines) {
    const grids = [];
    
    // Sort lines by position
    horizontalLines.sort((a, b) => a.y1 - b.y1);
    verticalLines.sort((a, b) => a.x1 - b.x1);
    
    // Find intersecting line groups
    for (let h = 0; h < horizontalLines.length - 1; h++) {
      for (let v = 0; v < verticalLines.length - 1; v++) {
        const grid = this.checkGridPattern(
          horizontalLines.slice(h),
          verticalLines.slice(v)
        );
        
        if (grid) {
          grids.push(grid);
        }
      }
    }
    
    return this.mergeOverlappingGrids(grids);
  }
  
  checkGridPattern(hLines, vLines) {
    const minRows = 2;
    const minCols = 2;
    
    let rows = 1, cols = 1;
    
    // Check horizontal spacing
    for (let i = 1; i < hLines.length; i++) {
      const spacing = hLines[i].y1 - hLines[i-1].y1;
      if (spacing > 10 && spacing < 100) {
        rows++;
      } else {
        break;
      }
    }
    
    // Check vertical spacing
    for (let i = 1; i < vLines.length; i++) {
      const spacing = vLines[i].x1 - vLines[i-1].x1;
      if (spacing > 20 && spacing < 200) {
        cols++;
      } else {
        break;
      }
    }
    
    if (rows >= minRows && cols >= minCols) {
      return {
        rows,
        cols,
        bbox: {
          x1: vLines[0].x1,
          y1: hLines[0].y1,
          x2: vLines[cols-1].x1,
          y2: hLines[rows-1].y1
        },
        lines: {
          horizontal: hLines.slice(0, rows),
          vertical: vLines.slice(0, cols)
        }
      };
    }
    
    return null;
  }
  
  mergeOverlappingGrids(grids) {
    const merged = [];
    
    for (const grid of grids) {
      let wasMerged = false;
      
      for (const existing of merged) {
        if (this.gridsOverlap(grid, existing)) {
          existing.bbox = this.mergeBBox(grid.bbox, existing.bbox);
          existing.rows = Math.max(grid.rows, existing.rows);
          existing.cols = Math.max(grid.cols, existing.cols);
          wasMerged = true;
          break;
        }
      }
      
      if (!wasMerged) {
        merged.push(grid);
      }
    }
    
    return merged;
  }
  
  gridsOverlap(grid1, grid2) {
    const bbox1 = grid1.bbox;
    const bbox2 = grid2.bbox;
    
    return !(bbox1.x2 < bbox2.x1 || 
             bbox2.x2 < bbox1.x1 || 
             bbox1.y2 < bbox2.y1 || 
             bbox2.y2 < bbox1.y1);
  }
  
  mergeBBox(bbox1, bbox2) {
    return {
      x1: Math.min(bbox1.x1, bbox2.x1),
      y1: Math.min(bbox1.y1, bbox2.y1),
      x2: Math.max(bbox1.x2, bbox2.x2),
      y2: Math.max(bbox1.y2, bbox2.y2)
    };
  }
  
  async extractTableContent(page, region) {
    const textContent = await page.getTextContent();
    const table = {
      bbox: region.bbox,
      rows: [],
      headers: [],
      pageNumber: page.pageNumber
    };
    
    // Group text items by row and column
    const cells = this.organizeCells(textContent.items, region);
    
    // Convert to table structure
    for (let r = 0; r < region.rows; r++) {
      const row = [];
      
      for (let c = 0; c < region.cols; c++) {
        const cellKey = `${r}_${c}`;
        row.push(cells[cellKey] || '');
      }
      
      if (r === 0) {
        table.headers = row;
      } else {
        table.rows.push(row);
      }
    }
    
    return table;
  }
  
  organizeCells(textItems, region) {
    const cells = {};
    const { bbox, rows, cols } = region;
    
    const rowHeight = (bbox.y2 - bbox.y1) / rows;
    const colWidth = (bbox.x2 - bbox.x1) / cols;
    
    for (const item of textItems) {
      const x = item.transform[4];
      const y = item.transform[5];
      
      // Check if text is within table region
      if (x >= bbox.x1 && x <= bbox.x2 && y >= bbox.y1 && y <= bbox.y2) {
        // Calculate cell position
        const row = Math.floor((y - bbox.y1) / rowHeight);
        const col = Math.floor((x - bbox.x1) / colWidth);
        
        const cellKey = `${row}_${col}`;
        
        if (!cells[cellKey]) {
          cells[cellKey] = '';
        }
        
        cells[cellKey] += item.str + ' ';
      }
    }
    
    // Trim cell contents
    for (const key in cells) {
      cells[key] = cells[key].trim();
    }
    
    return cells;
  }
}

module.exports = { TableExtractor };
