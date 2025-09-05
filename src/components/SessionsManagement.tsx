lassId);
            const teacher = teachers.find(t => t.id === sessionClass?.teacherId);
            const subject = subjects.find(s => s.id === sessionClass?.subjectId);
            const location = locations.find(l => l.id === session.locationId);
            const grade = grades.find(g => g.id === sessionClass?.gradeId);
            const reportStatus = getReportStatus(session.id);
            
            return (
              <div key={session.id} className="mobile-card">
                <div className="mobile-card-header">
                  <div className="mobile-card-title">
                    {sessionClass?.name || 'غير محدد'}
                    {grade?.name && <span className="text-sm text-gray-600"> - {grade.name}</span>}
                  </div>
                  <div className="mobile-btn-group">
                    <button
                      onClick={() => setShowSessionDetails(session.id)}
                      className="mobile-btn text-blue-600 hover:text-blue-900"
                      title="عرض التفاصيل"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleSendSessionReport(session.id)}
                      disabled={sendingReports[session.id] || reportStatus.status === 'sending'}
                      className="mobile-btn text-green-600 hover:text-green-900 disabled:opacity-50"
                      title="إرسال التقارير"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleToggleStatus(session.id)}
                      className={`mobile-btn ${session.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                      title={session.status === 'active' ? 'إيقاف الحصة' : 'تفعيل الحصة'}
                    >
                      {session.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    
                    {hasPermission('sessionsEdit') && (
                    <button
                      onClick={() => handleEdit(session)}
                      className="mobile-btn text-blue-600 hover:text-blue-900"
                      title="تعديل"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    )}
                    
                    {hasPermission('sessionsDelete') && (
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="mobile-btn text-red-600 hover:text-red-900"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    )}
                  </div>
                </div>
                
                <div className="mobile-card-content">
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">المعلم</div>
                    <div className="mobile-card-value">{teacher?.name || 'غير محدد'}</div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">المادة</div>
                    <div className="mobile-card-value">{subject?.name || 'غير محدد'}</div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">التاريخ</div>
                    <div className="mobile-card-value">{new Date(session.startTime).toLocaleDateString('en-GB')}</div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">الوقت</div>
                    <div className="mobile-card-value">
                      {new Date(session.startTime).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(session.endTime).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">المكان</div>
                    <div className="mobile-card-value">
                      {location?.name || 'غير محدد'}
                      {location?.roomNumber && ` - ${location.roomNumber}`}
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">الحالة</div>
                    <div className="mobile-card-value">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                        {getStatusText(session.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mobile-card-field">
                    <div className="mobile-card-label">حالة إرسال التقارير</div>
                    <div className="mobile-card-value">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <reportStatus.icon className={`h-4 w-4 ${reportStatus.color} ${reportStatus.status === 'sending' ? 'animate-spin' : ''}`} />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${reportStatus.bgColor} ${reportStatus.color}`}>
                          {reportStatus.text}
                        </span>
                      </div>
                      {reportStatus.details && (
                        <div className="text-xs text-gray-500 mt-1">
                          {reportStatus.details}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {session.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded">
                    <div className="text-xs text-gray-600 mb-1">الملاحظات:</div>
                    <div className="text-sm text-gray-800">{session.notes}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="mr-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  عرض <span className="font-medium">{startIndex + 1}</span> إلى{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredSessions.length)}</span> من{' '}
                  <span className="font-medium">{filteredSessions.length}</span> نتيجة
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {currentSessions.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filteredSessions.length === 0 ? 'لا توجد حصص مطابقة للبحث' : 'لا توجد بيانات في هذه الصفحة'}
          </p>
        </div>
      )}
    </div>
  );
};