import re

# 1. Update ClassesPage.jsx
with open("frontend/src/pages/admin/ClassesPage.jsx", "r", encoding="utf-8") as f:
    classes_content = f.read()

old_load_data = """  const loadData = async () => {
    try {
      setLoading(true);
      const [resCls, resDept] = await Promise.all([
        classService.getAll(),
        departmentService.getAll(),
      ]);
      setClasses(resCls.data.data || []);
      setDepartments(resDept.data.data || []);
      if (isAcademicStaff && staffDeptId) {
        setSelectedDept(String(staffDeptId));
      }
    } catch {
      toast.error('Lỗi khi tải dữ liệu lớp học');
    } finally {
      setLoading(false);
    }
  };"""

new_load_data = """  const loadData = async () => {
    try {
      setLoading(true);
      const [resCls, resDept] = await Promise.allSettled([
        classService.getAll(),
        departmentService.getAll(),
      ]);

      if (resCls.status === 'fulfilled') {
        setClasses(resCls.value?.data?.data || []);
      } else {
        console.error('Lỗi khi tải danh sách lớp:', resCls.reason);
        toast.error(resCls.reason?.response?.data?.message || 'Lỗi khi tải dữ liệu lớp học');
      }

      if (resDept.status === 'fulfilled') {
        setDepartments(resDept.value?.data?.data || []);
      }

      if (isAcademicStaff && staffDeptId) {
        setSelectedDept(String(staffDeptId));
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu lớp học:', err);
      toast.error('Lỗi khi tải dữ liệu lớp học');
    } finally {
      setLoading(false);
    }
  };"""

old_filtered = """  const filtered = classes.filter((c) => {
    const matchDept = selectedDept ? c.department?.id === parseInt(selectedDept) : true;
    const matchSearch = search
      ? c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.department?.name?.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchDept && matchSearch;
  });"""

new_filtered = """  const filtered = classes.filter((c) => {
    const matchDept = isAcademicStaff
      ? true
      : (selectedDept ? c.department?.id === parseInt(selectedDept) : true);
    const deptName = c.department?.name || (isAcademicStaff ? staffDeptName : '') || '';
    const matchSearch = search
      ? c.code?.toLowerCase().includes(search.toLowerCase()) ||
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        deptName.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchDept && matchSearch;
  });"""

old_col = "<td data-label=\"Khoa\" style={{ color: 'var(--text-secondary)' }}>{c.department?.name || '—'}</td>"
new_col = "<td data-label=\"Khoa\" style={{ color: 'var(--text-secondary)' }}>{c.department?.name || (isAcademicStaff ? staffDeptName : '—')}</td>"

# Normalize line endings for replacement
nl = "\r\n" if "\r\n" in classes_content else "\n"
classes_content = classes_content.replace(old_load_data.replace("\n", nl), new_load_data.replace("\n", nl))
classes_content = classes_content.replace(old_filtered.replace("\n", nl), new_filtered.replace("\n", nl))
classes_content = classes_content.replace(old_col, new_col)

with open("frontend/src/pages/admin/ClassesPage.jsx", "w", encoding="utf-8") as f:
    f.write(classes_content)
print("Updated ClassesPage.jsx")

# 2. Update StudentsPage.jsx
with open("frontend/src/pages/admin/StudentsPage.jsx", "r", encoding="utf-8") as f:
    students_content = f.read()

old_filtered_classes = """  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (selectedDepartment && c.department?.id !== parseInt(selectedDepartment)) return false;
      if (selectedCohort && c.academicYear !== selectedCohort) return false;
      return true;
    });
  }, [classes, selectedDepartment, selectedCohort]);"""

new_filtered_classes = """  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      if (selectedDepartment) {
        const cDeptId = c.department?.id || (isFacultyStaff && user?.departmentId ? user.departmentId : null);
        if (cDeptId && cDeptId !== parseInt(selectedDepartment)) return false;
      }
      if (selectedCohort && c.academicYear !== selectedCohort) return false;
      return true;
    });
  }, [classes, selectedDepartment, selectedCohort, isFacultyStaff, user?.departmentId]);"""

nl_stu = "\r\n" if "\r\n" in students_content else "\n"
students_content = students_content.replace(old_filtered_classes.replace("\n", nl_stu), new_filtered_classes.replace("\n", nl_stu))

with open("frontend/src/pages/admin/StudentsPage.jsx", "w", encoding="utf-8") as f:
    f.write(students_content)
print("Updated StudentsPage.jsx")
