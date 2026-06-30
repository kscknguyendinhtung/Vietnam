function doPost(e) {
  try {
    var json = JSON.parse(e.postData.contents);
    var type = json.type; // 'vocabulary', 'sentence', 'whiteboard'
    var data = json.data;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(type);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({status: "error", message: "Sheet not found: " + type}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    sheet.clearContents();
    
    // Process Data based on type
    if (type === 'whiteboard') {
        sheet.appendRow(["Tiêu đề Tab", "Câu Tiếng Việt", "Dịch mượt", "Từ vựng bóc tách", "Ngữ pháp"]);
        data.forEach(function(tab) {
          tab.lines.forEach(function(line) {
            var words = line.words.map(function(w) {
              return w.vi + ":" + w.en;
            }).join(', ');
            
            sheet.appendRow([
              tab.title,
              line.viText,
              line.fullEnText,
              words,
              line.grammar
            ]);
          });
        });
    } else {
        // Generic append for other types if they follow simple array structure
        if (Array.isArray(data)) {
            data.forEach(function(row) {
                sheet.appendRow(Object.values(row));
            });
        }
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
