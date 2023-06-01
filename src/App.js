import React from "react";

import CssBaseline from "@material-ui/core/CssBaseline";
import MaUTable from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableFooter from "@material-ui/core/TableFooter";

import TablePagination from "@material-ui/core/TablePagination";
import Paper from "@material-ui/core/Paper";

import IconButton from "@material-ui/core/IconButton";
import FirstPageIcon from "@material-ui/icons/FirstPage";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import LastPageIcon from "@material-ui/icons/LastPage";

import { fade, withStyles } from "@material-ui/core/styles";
import InputBase from "@material-ui/core/InputBase";

import { useTable, useSortBy, useFilters, usePagination } from "react-table";

import makeData from "./makeData";
import generateExcel from "zipcelx";

// This is a custom filter UI for selecting
// a unique option from a list
function SelectColumnFilter({
  column: { filterValue, setFilter, preFilteredRows, id }
}) {
  // Calculate the options for filtering
  // using the preFilteredRows
  const options = React.useMemo(() => {
    const options = new Set();
    preFilteredRows.forEach(row => {
      options.add(row.values[id]);
    });
    return [...options.values()];
  }, [id, preFilteredRows]);

  // Render a multi-select box
  return (
    <select
      value={filterValue}
      onChange={e => {
        setFilter(e.target.value || undefined);
      }}
      // prevent sorting on filter click
      onClick={e => e.stopPropagation()}
    >
      <option value="">All</option>
      {options.map((option, i) => (
        <option key={i} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

const StyledInput = withStyles(theme => ({
  root: {
    "label + &": {
      marginTop: theme.spacing(3)
    }
  },
  input: {
    borderRadius: 4,
    position: "relative",
    backgroundColor: theme.palette.common.white,
    border: "1px solid #ced4da",
    fontSize: 14,
    width: "auto",
    padding: "10px 12px",
    transition: theme.transitions.create(["border-color", "box-shadow"]),
    // Use the system font instead of the default Roboto font.
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "Roboto",
      '"Helvetica Neue"',
      "Arial",
      "sans-serif",
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(","),
    "&:focus": {
      boxShadow: `${fade(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
      borderColor: theme.palette.primary.main
    }
  }
}))(InputBase);

// Define a default UI for filtering
function DefaultColumnFilter({
  column: { filterValue, preFilteredRows, setFilter }
}) {
  const count = preFilteredRows.length;

  return (
    <StyledInput
      margin="none"
      variant="outlined"
      value={filterValue || ""}
      onChange={e => {
        setFilter(e.target.value || undefined); // Set undefined to remove the filter entirely
      }}
      // prevent sorting on filter click
      onClick={e => e.stopPropagation()}
      placeholder={`Search ${count} records...`}
    />
  );
}

function Table({ columns, data }) {
  // const filterTypes = React.useMemo(
  //   () => ({
  //     // Or, override the default text filter to use
  //     // "startWith"
  //     text: (rows, id, filterValue) => {
  //       return rows.filter(row => {
  //         const rowValue = row.values[id]
  //         return rowValue !== undefined
  //           ? String(rowValue)
  //               .toLowerCase()
  //               .startsWith(String(filterValue).toLowerCase())
  //           : true
  //       })
  //     },
  //   }),
  //   []
  // );

  const defaultColumn = React.useMemo(
    () => ({
      // Let's set up our default Filter UI
      Filter: DefaultColumnFilter
    }),
    []
  );

  // Use the state and functions returned from useTable to build your UI
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page, // Instead of using 'rows', we'll use page,
    // which has only the rows for the active page
    rows,

    // pagination stuff
    canPreviousPage,
    canNextPage,
    // pageOptions,
    pageCount,
    nextPage,
    previousPage,
    gotoPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns,
      data,
      defaultColumn, // Be sure to pass the defaultColumn option
      // filterTypes,
      initialState: { pageIndex: 0 },
      disableMultiSort: true
    },
    useFilters,
    useSortBy,
    usePagination
  );

  function getHeader(column) {
    if (column.totalHeaderCount === 1) {
      return [
        {
          value: column.Header,
          type: "string"
        }
      ];
    } else {
      const span = [...Array(column.totalHeaderCount - 1)].map(x => ({
        value: "",
        type: "string"
      }));
      return [
        {
          value: column.Header,
          type: "string"
        },
        ...span
      ];
    }
  }

  function getExcel() {
    const config = {
      filename: "general-ledger-Q1",
      sheet: {
        data: []
      }
    };

    const dataSet = config.sheet.data;

    // review with one level nested config
    // HEADERS
    headerGroups.forEach(headerGroup => {
      const headerRow = [];
      if (headerGroup.headers) {
        headerGroup.headers.forEach(column => {
          headerRow.push(...getHeader(column));
        });
      }

      dataSet.push(headerRow);
    });

    // FILTERED ROWS
    if (rows.length > 0) {
      rows.forEach(row => {
        const dataRow = [];

        Object.values(row.values).forEach(value =>
          dataRow.push({
            value,
            type: typeof value === "number" ? "number" : "string"
          })
        );

        dataSet.push(dataRow);
      });
    } else {
      dataSet.push([
        {
          value: "No data",
          type: "string"
        }
      ]);
    }

    return generateExcel(config);
  }

  // Render the UI for your table
  return (
    <Paper>
      <button onClick={getExcel}>Get Excel</button>
      <div style={{ overflowX: "auto" }}>
        <MaUTable
          {...getTableProps()}
          size="small" // dense table sizes
        >
          <TableHead>
            {headerGroups.map(headerGroup => (
              <TableRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map(column => {
                  // Add the sorting props to control sorting. For this example
                  // we can add them into the header props
                  return (
                    <TableCell
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      title={null}
                    >
                      {column.render("Header")}
                      {/* Add a sort direction indicator */}
                      <span>
                        {column.isSorted
                          ? column.isSortedDesc
                            ? " 🔽"
                            : " 🔼"
                          : ""}
                      </span>
                      {/* Render the columns filter UI */}
                      <div>
                        {column.canFilter ? column.render("Filter") : null}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()}>
            {page.map((row, i) => {
              prepareRow(row);
              return (
                <TableRow {...row.getRowProps()}>
                  {row.cells.map(cell => {
                    return (
                      <TableCell {...cell.getCellProps()}>
                        {cell.render("Cell")}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[10, 20, 30, 40, 50]}
                component="td"
                count={rows.length}
                rowsPerPage={pageSize}
                page={pageIndex}
                onChangePage={(e, p) => {
                  gotoPage(p);
                }}
                onChangeRowsPerPage={e => {
                  setPageSize(Number(e.target.value));
                }}
                ActionsComponent={() => (
                  <TablePaginationActions
                    {...{
                      previousPage,
                      nextPage,
                      gotoPage,
                      canPreviousPage,
                      canNextPage,
                      pageCount
                    }}
                  />
                )}
              />
            </TableRow>
          </TableFooter>
        </MaUTable>
        {/* 
        Pagination can be built however you'd like. 
        This is just a very basic UI implementation:
      */}
        {/* <div className="pagination">
        <button onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {"<<"}
        </button>{" "}
        <button onClick={() => previousPage()} disabled={!canPreviousPage}>
          {"<"}
        </button>{" "}
        <button onClick={() => nextPage()} disabled={!canNextPage}>
          {">"}
        </button>{" "}
        <button onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {">>"}
        </button>{" "}
        <span>
          Page{" "}
          <strong>
            {pageIndex + 1} of {pageOptions.length}
          </strong>{" "}
        </span>
        <span>
          | Go to page:{" "}
          <input
            type="number"
            defaultValue={pageIndex + 1}
            min={1}
            max={pageOptions.length}
            onChange={e => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(page);
            }}
            style={{ width: "100px" }}
          />
        </span>{" "}
        <select
          value={pageSize}
          onChange={e => {
            setPageSize(Number(e.target.value));
          }}
        >
          {[10, 20, 30, 40, 50].map(pageSize => (
            <option key={pageSize} value={pageSize}>
              Show {pageSize}
            </option>
          ))}
        </select>
      </div> */}
      </div>
    </Paper>
  );
}

function TablePaginationActions({
  previousPage,
  nextPage,
  gotoPage,
  canPreviousPage,
  canNextPage,
  pageCount
}) {
  const handleFirstPageButtonClick = () => {
    gotoPage(0);
  };

  const handleBackButtonClick = () => {
    previousPage();
  };

  const handleNextButtonClick = () => {
    nextPage();
  };

  const handleLastPageButtonClick = () => {
    gotoPage(pageCount - 1);
  };

  return (
    <div style={{ flexShrink: 0 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={!canPreviousPage}
        aria-label="first page"
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={!canPreviousPage}
        aria-label="previous page"
      >
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={!canNextPage}
        aria-label="next page"
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={!canNextPage}
        aria-label="last page"
      >
        <LastPageIcon />
      </IconButton>
    </div>
  );
}

function App() {
  // const columns = React.useMemo(
  //   () => [
  //     {
  //       Header: "Name",
  //       columns: [
  //         {
  //           Header: "First Name",
  //           accessor: "firstName",
  //         },
  //         {
  //           Header: "Last Name",
  //           accessor: "lastName",
  //         },
  //       ],
  //     },
  //     {
  //       Header: "Info",
  //       columns: [
  //         {
  //           Header: "Age",
  //           accessor: "age",
  //         },
  //         {
  //           Header: "Visits",
  //           accessor: "visits",
  //         },
  //         {
  //           Header: "Status",
  //           accessor: "status",
  //           Filter: SelectColumnFilter,
  //           filter: "includes",
  //         },
  //         {
  //           Header: "Profile Progress",
  //           accessor: "progress",
  //         },
  //       ],
  //     },
  //   ],
  //   [],
  // );
  const columns = React.useMemo(
    () => [
      {
        Header: "First Name",
        accessor: "firstName",
        show: false
      },
      {
        Header: "Last Name",
        accessor: "lastName"
      },
      {
        Header: "Age",
        accessor: "age"
      },
      {
        Header: "Visits",
        accessor: "visits"
      },
      {
        Header: "Status",
        accessor: "status",
        Filter: SelectColumnFilter,
        filter: "includes"
      },
      {
        Header: "Profile Progress",
        accessor: "progress"
      }
    ],
    []
  );

  const data = React.useMemo(() => makeData(50), []);

  return (
    <div>
      <CssBaseline />
      <Table columns={columns} data={data} />
    </div>
  );
}

export default App;
