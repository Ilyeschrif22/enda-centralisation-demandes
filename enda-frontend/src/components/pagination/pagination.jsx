import './pagination.css';

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
    if (totalPages <= 1) return null;

    const getPages = () => {
        const pages = [];
        const delta = 1;

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }
        return pages;
    };

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="pagination">
            <span className="pagination-info">
                {start}–{end} sur {totalItems}
            </span>

            <div className="pagination-controls">
                <button
                    type="button"
                    className="pagination-btn"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    ‹
                </button>

                {getPages().map((page, idx) =>
                    page === "..." ? (
                        <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
                    ) : (
                        <button
                            type="button"
                            key={page}
                            className={`pagination-btn ${page === currentPage ? "active" : ""}`}
                            onClick={() => onPageChange(page)}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    type="button"
                    className="pagination-btn"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    ›
                </button>
            </div>
        </div>
    );
};

export default Pagination;