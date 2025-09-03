const { executeQuery } = require('../config/database');

class Grade {
  static async getAll() {
    const query = `
      SELECT * FROM grades 
      WHERE is_active = TRUE 
      ORDER BY level ASC
    `;
    return await executeQuery(query);
  }

  static async findById(id) {
    const query = 'SELECT * FROM grades WHERE id = ? AND is_active = TRUE';
    const results = await executeQuery(query, [id]);
    return results[0] || null;
  }

  static async create(gradeData) {
    const { name, level, description } = gradeData;
    const query = `
      INSERT INTO grades (name, level, description) 
      VALUES (?, ?, ?)
    `;
    
    const result = await executeQuery(query, [
      name, 
      level, 
      description || null
    ]);
    
    return result.insertId;
  }

  static async update(id, gradeData) {
    const { name, level, description } = gradeData;
    const query = `
      UPDATE grades 
      SET name = ?, level = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    const result = await executeQuery(query, [
      name, 
      level, 
      description || null, 
      id
    ]);
    
    return result.affectedRows > 0;
  }

  static async delete(id) {
    // حذف فعلي من قاعدة البيانات
    const query = 'DELETE FROM grades WHERE id = ?';
    const result = await executeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  static async checkUsage(id) {
    const query = `
      SELECT COUNT(*) as classCount 
      FROM classes 
      WHERE grade_id = ?
    `;
    const result = await executeQuery(query, [id]);
    return result[0].classCount;
  }
}

module.exports = Grade;