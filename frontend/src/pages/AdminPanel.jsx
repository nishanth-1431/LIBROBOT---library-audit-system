import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import domtoimage from 'dom-to-image';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Search, FileText, Download, RotateCcw, Upload, Library, Settings, MapPin, Printer, Trash2, Plus, XCircle } from 'lucide-react';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';
import JsBarcode from 'jsbarcode';
import axios from 'axios';
import Sidebar from '../components/Sidebar';

// We will now handle this via state inside the component
// const SHELF_MAP = { ... };
// const getShelfForDept = (dept) => SHELF_MAP[dept?.trim()] || 'A1';

export default function AdminPanel() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const API_BASE = import.meta.env.PROD ? '' : 'http://127.0.0.1:5000';
    const API_URL = `${API_BASE}/api/books`;

    const [books, setBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

    // Form State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState(null);
    const [formData, setFormData] = useState({ barcode: '', name: '', author: '', department: '', shelf: '' });
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [shelfMap, setShelfMap] = useState({});
    const [isShelfMapModalOpen, setIsShelfMapModalOpen] = useState(false);
    const [newMapping, setNewMapping] = useState({ dept: '', shelf: '' });
    
    const tableRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!tableRef.current) return;
        const rect = tableRef.current.getBoundingClientRect();
        setMousePos({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        });
    };

    // Batch Actions State
    const [selectedBooks, setSelectedBooks] = useState([]);

    useEffect(() => {
        fetchBooks();
        fetchShelfMap();
    }, []);

    const fetchShelfMap = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/shelves`);
            setShelfMap(res.data.shelf_map || {});
        } catch (err) {
            console.error("Failed to fetch shelf map", err);
        }
    };

    const getShelfForDept = (dept) => {
        const d = dept?.trim().toLowerCase();
        if (!d) return 'A1';
        for (const [key, val] of Object.entries(shelfMap)) {
            if (key.toLowerCase() === d) return val;
        }
        return 'A1';
    };

    const departments = useMemo(() => {
        const depts = new Set(books.map(b => b.department).filter(Boolean));
        return ['All', ...Array.from(depts).sort()];
    }, [books]);

    const filteredBooks = useMemo(() => {
        let result = books;

        if (selectedDepartment !== 'All') {
            result = result.filter(b => b.department === selectedDepartment);
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(b =>
                b.name.toLowerCase().includes(lowerQuery) ||
                b.author.toLowerCase().includes(lowerQuery) ||
                b.barcode.toString().includes(lowerQuery) ||
                (b.department && b.department.toLowerCase().includes(lowerQuery))
            );
        }
        // Always sort by name for consistent scanning efficiency
        return [...result].sort((a, b) => a.name.localeCompare(b.name));
    }, [books, searchQuery, selectedDepartment]);



    const fetchBooks = async () => {
        try {
            setLoading(true);
            const response = await axios.get(API_URL);
            if (response.data.ERROR) {
                setError(response.data.ERROR);
                setBooks([]);
            } else {
                setBooks(Object.values(response.data));
                setError('');
            }
        } catch (err) {
            console.error("Failed to load books", err);
            setError('Failed to connect to backend server.');
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        try {
            setLoading(true);
            const res = await axios.post(`${API_BASE}/api/books/reload`);
            setStatusMessage({ text: res.data.message, type: 'success' });
            fetchBooks();
        } catch (err) {
            setStatusMessage({ 
                text: err.response?.data?.error || "Sync failed. Close Excel file first.", 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const handleDelete = async (barcode) => {
        if (!window.confirm(`Are you sure you want to delete book with barcode ${barcode}?`)) return;

        try {
            await axios.delete(`${API_URL}/${barcode}`);
            showStatus('Book deleted successfully', 'success');
            fetchBooks();
        } catch (err) {
            showStatus('Failed to delete book', 'error');
            console.error(err);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedBooks(filteredBooks.map(b => b.barcode));
        } else {
            setSelectedBooks([]);
        }
    };

    const handleSelect = (barcode) => {
        setSelectedBooks(prev =>
            prev.includes(barcode)
                ? prev.filter(b => b !== barcode)
                : [...prev, barcode]
        );
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete ${selectedBooks.length} books?`)) return;

        try {
            await axios.post(`${API_URL}/bulk-delete`, { barcodes: selectedBooks });
            showStatus(`${selectedBooks.length} books deleted successfully`, 'success');
            setSelectedBooks([]);
            fetchBooks();
        } catch (err) {
            showStatus('Failed to delete selected books', 'error');
            console.error(err);
        }
    };

    const handleExportDb = (format = 'xlsx') => {
        window.open(`${API_BASE}/api/books/export?format=${format}`, '_blank');
    };

    const handleImportDb = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!window.confirm("WARNING: Importing this file will merge it into the current database. Existing barcodes will be overwritten by new data. Are you absolutely sure?")) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await axios.post(`${API_BASE}/api/books/import`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            showStatus(res.data.message, 'success');
            setIsImportModalOpen(false);
            fetchBooks();
        } catch (err) {
            showStatus(err.response?.data?.error || 'Failed to import database', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }

        // Reset file input
        e.target.value = null;
    };

    const handleUndoImport = async () => {
        if (!window.confirm("Are you sure you want to undo the last Excel import? This will restore the previous database state.")) return;
        
        try {
            setLoading(true);
            const res = await axios.post(`${API_BASE}/api/books/undo_import`);
            showStatus(res.data.message, 'success');
            setIsImportModalOpen(false);
            fetchBooks();
        } catch (err) {
            showStatus(err.response?.data?.error || 'Failed to undo import. No backup found.', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBook) {
                await axios.put(`${API_URL}/${editingBook.barcode}`, formData);
                showStatus('Book updated successfully', 'success');
            } else {
                await axios.post(API_URL, formData);
                showStatus('Book added successfully', 'success');
            }
            closeModal();
            fetchBooks();
        } catch (err) {
            showStatus(err.response?.data?.error || 'Failed to save book', 'error');
            console.error(err);
        }
    };

    const openModal = (book = null) => {
        if (book) {
            setEditingBook(book);
            setFormData({ barcode: book.barcode, name: book.name, author: book.author, department: book.department || '', shelf: book.shelf || getShelfForDept(book.department) });
        } else {
            setEditingBook(null);
            setFormData({ barcode: '', name: '', author: '', department: '', shelf: '' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBook(null);
        setFormData({ barcode: '', name: '', author: '', department: '', shelf: '' });
    };

    const handleSaveShelfMap = async () => {
        try {
            await axios.post(`${API_BASE}/api/settings/shelf_map`, shelfMap);
            showStatus("Shelf map updated!", "success");
            setIsShelfMapModalOpen(false);
            fetchShelfMap();
        } catch (err) {
            showStatus("Failed to update shelf map.", "error");
        }
    };

    const addMapping = () => {
        if (!newMapping.dept || !newMapping.shelf) return;
        setShelfMap(prev => ({ ...prev, [newMapping.dept]: newMapping.shelf }));
        setNewMapping({ dept: '', shelf: '' });
    };

    const removeMapping = (dept) => {
        const newMap = { ...shelfMap };
        delete newMap[dept];
        setShelfMap(newMap);
    };

    const handleDeptChange = (dept) => {
        setFormData(prev => ({ ...prev, department: dept, shelf: getShelfForDept(dept) }));
    };

    const downloadBarcode = () => {
        const node = document.getElementById('barcode-container');
        if (!node) return;

        // Multiply resolution for high-quality capture
        const scale = 3;

        domtoimage.toPng(node, {
            bgcolor: '#ffffff',
            height: node.offsetHeight * scale,
            width: node.offsetWidth * scale,
            style: {
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                width: `${node.offsetWidth}px`,
                height: `${node.offsetHeight}px`
            }
        })
            .then(function (dataUrl) {
                // Dimensions in mm for a standard small barcode sticker
                const pdfWidth = 60;
                const pdfHeight = 30;
                
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: [pdfWidth, pdfHeight]
                });
                
                // Add the captured high-res PNG to the PDF
                pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`Barcode_${formData.barcode || 'New'}.pdf`);
                
                showStatus("PDF generated successfully.", "success");
            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);
                showStatus("Failed to generate PDF image.", "error");
            });
    };

    const handleDownloadBulkBarcodes = () => {
        if (selectedBooks.length === 0) return;

        try {
            showStatus("Generating PDF grid...", "success");
            
            // Standard A4 dimensions in mm: 210 x 297
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            // Grid variables
            const marginX = 15;
            const marginY = 15;
            const stickerWidth = 55; // width of each barcode
            const stickerHeight = 25; // height of each barcode
            const spacingX = 5;
            const spacingY = 5;
            
            const cols = 3; // 3 columns fits well on A4 (15 + 3*55 + 2*5 = 190 < 210)
            const rowsPerPage = 10; // 10 rows (15 + 10*25 + 9*5 = 310, need to adjust slightly)
            // recalculate rows to ensure it fits (297 - 2*15) / (25+5) ≈ 8.9
            const actualRowsPerPage = 8; 

            // Create a temporary hidden canvas to generate high-res barcodes via JsBarcode
            const tempCanvas = document.createElement('canvas');

            let currentX = marginX;
            let currentY = marginY;
            let colIndex = 0;
            let rowIndex = 0;

            selectedBooks.forEach((barcode, index) => {
                // Check if we need a new page
                if (rowIndex >= actualRowsPerPage) {
                    pdf.addPage();
                    currentX = marginX;
                    currentY = marginY;
                    colIndex = 0;
                    rowIndex = 0;
                }

                // Calculate positions
                const xPos = marginX + (colIndex * (stickerWidth + spacingX));
                const yPos = marginY + (rowIndex * (stickerHeight + spacingY));

                // 1. Generate barcode on canvas
                JsBarcode(tempCanvas, barcode, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 16,
                    margin: 10,
                    width: 3, 
                    height: 80 
                });

                // 2. Extract image from canvas
                const dataUrl = tempCanvas.toDataURL("image/png");

                // 3. Add to PDF
                pdf.addImage(dataUrl, 'PNG', xPos, yPos, stickerWidth, stickerHeight);

                // Move grid cursor
                colIndex++;
                if (colIndex >= cols) {
                    colIndex = 0;
                    rowIndex++;
                }
            });

            // Save the resulting grid document
            pdf.save(`Bulk_Barcodes_${new Date().getTime()}.pdf`);
            showStatus("Bulk PDF generated successfully.", "success");
            
        } catch (error) {
            console.error("Failed bulk generation", error);
            showStatus("Failed to generate bulk PDF.", "error");
        }
    };

    const showStatus = (text, type) => {
        setStatusMessage({ text, type });
        setTimeout(() => setStatusMessage({ text: '', type: '' }), 3000);
    };

    return (
        <div className="min-h-screen bg-background text-textMain flex overflow-hidden font-sans transition-colors duration-300">
            {/* Ambient glows */}
            <div className="fixed top-0 left-0 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-0 right-0 w-[400px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

            <Sidebar subtitle="Admin Control" />

            {/* ── Main ───────────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col h-screen relative z-10 overflow-hidden">
                {/* Header */}
                <header className="px-8 pt-8 pb-5 border-b border-border/50 bg-header/80 backdrop-blur-sm shrink-0 transition-colors">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-textMain">Books Database</h2>
                            <p className="text-xs text-textDim mt-1">Manage inventory — add, edit, delete & export books</p>
                        </div>
                        <div className="flex gap-2 items-end">
                            <button
                                onClick={handleSync}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-lg border border-emerald-500/30 transition-all uppercase tracking-wider"
                                title="Reload data from Excel file"
                            >
                                <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
                                Sync DB
                            </button>
                            <input type="file" id="excel-upload" accept=".xlsx, .xls, .csv, .ods" className="hidden" onChange={handleImportDb} />
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-surface/60 hover:bg-surface text-textDim hover:text-textMain text-xs font-semibold rounded-lg border border-border transition-all uppercase tracking-wider"
                                title="Manage Database Imports"
                            >
                                <Upload size={14} /> Import / Undo
                            </button>
                            
                            {/* Export Dropdown Group */}
                            <div className="relative group/export">
                                <button
                                    onClick={() => handleExportDb('xlsx')}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-surface/60 hover:bg-surface text-textDim hover:text-textMain text-xs font-semibold rounded-lg border border-border transition-all uppercase tracking-wider"
                                >
                                    <Download size={14} /> Backup DB
                                </button>
                                <AnimatePresence>
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        whileHover={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute top-full right-0 mt-2 w-48 bg-surface border border-border/80 shadow-xl rounded-xl p-2 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-50 origin-top-right"
                                    >
                                        <p className="px-3 py-1.5 text-[10px] text-textDim font-bold uppercase tracking-widest border-b border-border/50 mb-1">Export Format</p>
                                        <button onClick={() => handleExportDb('xlsx')} className="w-full text-left px-3 py-2 text-sm text-textMain hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">Excel (.xlsx)</button>
                                        <button onClick={() => handleExportDb('csv')} className="w-full text-left px-3 py-2 text-sm text-textMain hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">Comma Separated (.csv)</button>
                                        <button onClick={() => handleExportDb('ods')} className="w-full text-left px-3 py-2 text-sm text-textMain hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">OpenDocument (.ods)</button>
                                        <button onClick={() => handleExportDb('xls')} className="w-full text-left px-3 py-2 text-sm text-textMain hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">Legacy Excel (.xls)</button>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            <button
                                onClick={() => setIsShelfMapModalOpen(true)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-surface/60 hover:bg-surface text-textDim hover:text-textMain text-xs font-semibold rounded-lg border border-border transition-all uppercase tracking-wider"
                                title="Manage Department to Shelf Mappings"
                            >
                                <MapPin size={14} /> Shelves
                            </button>
                            <motion.button
                                whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(var(--primary-rgb),0.2)' }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => openModal()}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary/90 hover:bg-primary text-white text-xs font-bold rounded-lg shadow-[0_2px_12px_rgba(var(--primary-rgb),0.2)] transition-all uppercase tracking-wider"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                Add Book
                            </motion.button>
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                            { label: 'Total Books', value: books.length, icon: Library, color: 'var(--primary)', bg: 'rgba(var(--primary-rgb),0.08)', border: 'rgba(var(--primary-rgb),0.2)' },
                            { label: 'System Status', value: 'Online', icon: Settings, color: 'var(--success)', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
                            { label: 'Filtered Results', value: filteredBooks.length, icon: Search, color: 'var(--primary)', bg: 'rgba(var(--primary-rgb),0.08)', border: 'rgba(var(--primary-rgb),0.2)' },
                        ].map(({ label, value, icon: Icon, color, bg, border }) => (
                            <div key={label} className="flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm" style={{ background: bg, borderColor: border }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
                                    <Icon size={17} style={{ color }} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-textDim uppercase tracking-widest font-semibold">{label}</p>
                                    <p className="text-lg font-black text-textMain leading-tight">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="relative flex-1 max-w-lg">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-textDim" />
                            <input
                                type="text"
                                placeholder="Search title, author, barcode or department..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-surface border border-border/50 rounded-xl text-sm text-textMain placeholder:text-textDim focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                            <label className="text-[10px] font-bold text-textDim uppercase tracking-widest">Filter Dept:</label>
                            <select 
                                value={selectedDepartment}
                                onChange={(e) => setSelectedDepartment(e.target.value)}
                                className="bg-surface border border-border/50 rounded-lg px-3 py-1.5 text-xs font-semibold text-textMain focus:outline-none focus:border-primary/50 cursor-pointer"
                            >
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </header>

                {/* Status Toast */}
                <AnimatePresence>
                    {statusMessage.text && (
                        <motion.div
                            initial={{ opacity: 0, y: -16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -16 }}
                            className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full flex items-center gap-2 shadow-2xl backdrop-blur-md border text-sm font-semibold ${statusMessage.type === 'error'
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                }`}
                        >
                            {statusMessage.type === 'error' ? '✕' : '✓'} {statusMessage.text}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Table Area */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-10 h-10 border-2 border-border border-t-primary rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div 
                            ref={tableRef}
                            onMouseMove={handleMouseMove}
                            className="flex-1 overflow-hidden flex flex-col glass-panel border-border/50 bg-surface/30 group/table relative"
                        >
                            {/* Spotlight effect for the whole table container */}
                            <div 
                                className="absolute inset-0 z-0 opacity-0 group-hover/table:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{
                                    background: `radial-gradient(1200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(var(--primary-rgb), 0.03), transparent 40%)`
                                }}
                            />

                            {/* Inventory Table */}
                            <div className="bg-sidebar/80 border-b border-border/60 z-10 sticky top-0 shadow-sm transition-colors">
                                <div className="grid grid-cols-[40px_130px_2.5fr_1.5fr_1fr_80px_100px] gap-4 px-6 py-4 items-center">
                                    <div className="flex items-center justify-center">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-border/50 bg-background/50 accent-primary cursor-pointer"
                                            checked={filteredBooks.length > 0 && selectedBooks.length === filteredBooks.length}
                                            onChange={handleSelectAll}
                                        />
                                    </div>
                                    <div className="text-[10px] font-bold text-textDim uppercase tracking-widest">Barcode</div>
                                    <div className="text-[10px] font-bold text-textDim uppercase tracking-widest">Title</div>
                                    <div className="text-[10px] font-bold text-textDim uppercase tracking-widest">Author</div>
                                    <div className="text-[10px] font-bold text-textDim uppercase tracking-widest">Department</div>
                                    <div className="text-[10px] font-bold text-textDim uppercase tracking-widest text-center">Shelf</div>
                                    <div className="text-[10px] font-bold text-textDim uppercase tracking-widest text-right">Actions</div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                                {filteredBooks.length === 0 ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-textDim text-sm gap-4 transition-all animate-in fade-in zoom-in duration-500">
                                        <div className="relative">
                                            <motion.div
                                                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                                                transition={{ repeat: Infinity, duration: 4 }}
                                                className="absolute inset-0 bg-primary/20 rounded-full blur-2xl"
                                            />
                                            <Database size={64} className="opacity-10 relative z-10" />
                                        </div>
                                        <div className="text-center">
                                            <p className="font-bold tracking-tight text-textMain">{loading ? 'Loading...' : 'No books match your query'}</p>
                                            <p className="text-[10px] uppercase tracking-widest mt-1 opacity-60">Adjust your search or add a new book</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/20">
                                        <AnimatePresence>
                                            {filteredBooks.map((book, idx) => (
                                                <motion.div
                                                    key={book.barcode}
                                                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                                    className={`grid grid-cols-[40px_130px_2.5fr_1.5fr_1fr_80px_100px] gap-4 px-6 py-4 items-center hover:bg-surface/50 transition-colors group relative border-l-2 ${selectedBooks.includes(book.barcode) ? 'border-primary/60 bg-primary/5 hover:bg-primary/10' : 'border-transparent hover:border-primary/40'}`}
                                                >
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded border-border/50 bg-background/50 accent-primary cursor-pointer"
                                                            checked={selectedBooks.includes(book.barcode)}
                                                            onChange={() => handleSelect(book.barcode)}
                                                        />
                                                    </div>
                                                    <div className="font-mono text-xs"><span className="bg-primary/5 text-primary/80 px-2 py-1 rounded border border-primary/10 tracking-widest">{book.barcode}</span></div>
                                                    <div className="text-sm font-semibold text-textMain truncate pr-4" title={book.name}>{book.name}</div>
                                                    <div className="text-xs text-textDim truncate font-medium pr-4" title={book.author}>{book.author}</div>
                                                    <div className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/5 text-primary/60 truncate" title={book.department}>{book.department || 'General'}</div>
                                                    <div className="flex justify-center">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-primary/20 bg-primary/8 text-primary/70 font-mono font-black text-[11px]">
                                                            <MapPin size={9} />{book.shelf || 'A1'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => openModal(book)} className="p-2 bg-surface/40 hover:bg-primary/10 text-textDim hover:text-primary rounded-lg transition-all border border-border/40 hover:border-primary/30 group/btn" title="Edit Book"><svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                                        <button onClick={() => handleDelete(book.barcode)} className="p-2 bg-danger/5 hover:bg-danger/20 text-danger/60 hover:text-danger rounded-lg transition-all border border-danger/10 hover:border-danger/30 group/btn" title="Remove"><svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Floating Action Bar */}
            <AnimatePresence>
                {selectedBooks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 50, x: '-50%' }}
                        className="fixed bottom-8 left-1/2 z-40 bg-surface border border-border/80 shadow-[0_10px_40px_rgba(0,0,0,0.5)] rounded-2xl px-6 py-3 flex items-center gap-6"
                    >
                        <div className="flex items-center gap-2">
                            <span className="bg-primary/20 text-primary px-2.5 py-0.5 rounded-md text-sm font-bold">{selectedBooks.length}</span>
                            <span className="text-textDim text-sm font-medium">books selected</span>
                        </div>
                        <div className="w-px h-6 bg-border/50" />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleDownloadBulkBarcodes}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-sm font-semibold transition-all"
                                title="Download printable PDF of selected barcodes"
                            >
                                <FileText size={16} />
                                Generate PDF
                            </button>
                            <button
                                onClick={() => setSelectedBooks([])}
                                className="text-textDim hover:text-textMain text-sm font-medium transition-colors ml-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-sm font-semibold transition-all"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete Selected
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Modal ──────────────────────────────────────────────────── */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && closeModal()}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="relative bg-surface/95 backdrop-blur-xl border border-border/60 rounded-3xl w-full max-w-md shadow-[0_20px_80px_rgba(0,0,0,0.6)]"
                        >
                            {/* Corner accents */}
                            <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none">
                                <div className="absolute top-px left-4 right-0 h-px bg-primary/30" />
                                <div className="absolute top-4 left-px bottom-0 w-px bg-primary/30" />
                            </div>

                            {/* Modal Header */}
                            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-background/50 transition-colors">
                                <div>
                                    <h3 className="text-base font-bold text-textMain">{editingBook ? 'Edit Book Record' : 'Add New Book'}</h3>
                                    <p className="text-xs text-textDim mt-0.5">{editingBook ? 'Update book details in the database' : 'Register a new book to the inventory'}</p>
                                </div>
                                <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface hover:bg-background text-textDim hover:text-textMain transition-colors border border-border/40">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {[{ key: 'barcode', label: 'Barcode / ID', placeholder: 'e.g. 1001', disabled: !!editingBook },
                                { key: 'name', label: 'Book Title', placeholder: 'Full book title' },
                                { key: 'author', label: 'Author', placeholder: 'Author name' }]
                                    .map(({ key, label, placeholder, disabled }) => (
                                        <div key={key}>
                                            <label className="block text-[10px] text-textDim font-semibold uppercase tracking-widest mb-1.5">{label}</label>
                                            <input
                                                type="text"
                                                required
                                                disabled={disabled}
                                                value={formData[key]}
                                                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                                className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm text-textMain placeholder:text-textDim focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                                placeholder={placeholder}
                                            />
                                        </div>
                                    ))}
                                {/* Department selector */}
                                <div>
                                    <label className="block text-[10px] text-textDim font-semibold uppercase tracking-widest mb-1.5">Department</label>
                                    <select
                                        value={formData.department}
                                        onChange={(e) => handleDeptChange(e.target.value)}
                                        className="w-full bg-surface border border-border/60 rounded-xl px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
                                    >
                                        <option value="">Select department...</option>
                                        {Object.keys(shelfMap).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                {/* Shelf (auto-filled, read-only) */}
                                <div>
                                    <label className="block text-[10px] text-textDim font-semibold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin size={10} /> Assigned Shelf</label>
                                    <div className="w-full bg-background/50 border border-border/40 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-primary/80 flex items-center gap-2">
                                        <MapPin size={14} className="text-primary/60" />
                                        {formData.shelf || getShelfForDept(formData.department) || 'A1'}
                                        <span className="ml-auto text-[10px] text-textDim font-sans font-normal">Auto-assigned from department</span>
                                    </div>
                                </div>

                                <div className="flex gap-2.5 pt-2">
                                    {formData.barcode && (
                                        <button type="button" onClick={downloadBarcode} className="h-11 px-4 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors border border-indigo-500/20 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider shrink-0" title="Download Barcode as Printable PDF">
                                            <Printer size={14} /> PDF
                                        </button>
                                    )}
                                    <button type="button" onClick={closeModal} className="h-11 px-5 rounded-xl bg-surface/50 hover:bg-surface text-textDim hover:text-textMain text-xs font-bold transition-colors border border-border/40 uppercase tracking-wider shrink-0">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="h-11 flex-1 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-[0_5px_15px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_8px_25px_rgba(var(--primary-rgb),0.4)] transition-all flex items-center justify-center gap-2"
                                    >
                                        {editingBook ? 'Save Changes' : 'Add Book'}
                                    </button>
                                </div>
                            </form>

                            {/* Live Barcode Preview */}
                            {formData.barcode && (
                                <div className="px-6 pb-6 pt-2 border-t border-border/50 flex flex-col items-center bg-background/20 transition-colors">
                                    <p className="text-[10px] text-textDim mb-3 uppercase tracking-widest font-semibold">Live Barcode Preview</p>
                                    <div id="barcode-container" className="bg-white p-4 rounded-xl shadow-inner inline-block">
                                        <Barcode value={formData.barcode} format="CODE128" width={2} height={60} displayValue={true} background="#ffffff" lineColor="#000000" margin={0} />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Import/Undo Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {isImportModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setIsImportModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                            className="relative bg-surface/95 backdrop-blur-xl border border-border/60 rounded-3xl w-full max-w-sm shadow-[0_20px_80px_rgba(0,0,0,0.6)] overflow-hidden"
                        >
                            {/* Corner accents */}
                            <div className="absolute top-0 left-0 w-12 h-12 pointer-events-none">
                                <div className="absolute top-px left-4 right-0 h-px bg-primary/30" />
                                <div className="absolute top-4 left-px bottom-0 w-px bg-primary/30" />
                            </div>

                            {/* Header */}
                            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-background/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                        <Database size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-textMain">Database Actions</h3>
                                        <p className="text-[10px] text-textDim mt-0.5 uppercase tracking-widest">Manage imports</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsImportModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface hover:bg-background text-textDim hover:text-textMain transition-colors border border-border/40">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <button
                                    onClick={() => document.getElementById('excel-upload').click()}
                                    className="w-full group flex flex-col items-center justify-center gap-3 p-6 bg-surface/50 hover:bg-primary/10 border border-border/50 hover:border-primary/40 rounded-2xl transition-all"
                                >
                                    <div className="w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center text-primary transition-colors">
                                        <Upload size={20} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-textMain group-hover:text-primary transition-colors">Import Data File</p>
                                        <p className="text-xs text-textDim mt-1">Accepts .xlsx, .csv, .ods, .xls<br/>Merge incoming data with existing DB</p>
                                    </div>
                                </button>

                                <div className="relative py-2">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
                                    <div className="relative flex justify-center"><span className="bg-surface/95 px-3 text-[10px] font-bold uppercase tracking-widest text-textDim">OR</span></div>
                                </div>

                                <button
                                    onClick={handleUndoImport}
                                    className="w-full group flex flex-col items-center justify-center gap-3 p-6 bg-surface/50 hover:bg-amber-500/10 border border-border/50 hover:border-amber-500/40 rounded-2xl transition-all"
                                >
                                    <div className="w-12 h-12 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center text-amber-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-textMain group-hover:text-amber-500 transition-colors">Undo Last Import</p>
                                        <p className="text-xs text-textDim mt-1">Restore the previous database state</p>
                                    </div>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* ── Shelf Map Modal ─────────────────────────────────────── */}
            <AnimatePresence>
                {isShelfMapModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setIsShelfMapModalOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-surface/95 backdrop-blur-xl border border-border/60 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-border/50 flex justify-between items-center">
                                <div>
                                    <h3 className="text-base font-bold text-textMain">Department Shelf Mapping</h3>
                                    <p className="text-xs text-textDim mt-0.5">Define which department belongs to which shelf</p>
                                </div>
                                <button onClick={() => setIsShelfMapModalOpen(false)} className="text-textDim hover:text-textMain"><XCircle size={20} /></button>
                            </div>
                            <div className="p-6 max-h-[400px] overflow-y-auto custom-scrollbar space-y-3">
                                {Object.entries(shelfMap).map(([dept, shelf]) => (
                                    <div key={dept} className="flex items-center gap-3 p-3 bg-background/50 rounded-xl border border-border/40 group">
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-textMain">{dept}</p>
                                            <p className="text-[10px] text-primary font-mono">{shelf}</p>
                                        </div>
                                        <button onClick={() => removeMapping(dept)} className="p-1.5 text-rose-500/50 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-3">
                                    <input 
                                        type="text" placeholder="Dept Name" value={newMapping.dept}
                                        onChange={e => setNewMapping({...newMapping, dept: e.target.value})}
                                        className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-textMain"
                                    />
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" placeholder="Shelf ID" value={newMapping.shelf}
                                            onChange={e => setNewMapping({...newMapping, shelf: e.target.value})}
                                            className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-textMain flex-1"
                                        />
                                        <button onClick={addMapping} className="p-2 bg-primary text-white rounded-xl"><Plus size={16} /></button>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-border/50 flex gap-3">
                                <button onClick={() => setIsShelfMapModalOpen(false)} className="flex-1 py-2 rounded-xl bg-surface border border-border text-xs font-bold uppercase text-textDim tracking-widest">Cancel</button>
                                <button onClick={handleSaveShelfMap} className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold uppercase tracking-widest">Save Changes</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
