import { Autocomplete, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Link as RouterLink } from "react-router-dom";

import aroma_icon from "../Asset/aroma-icon.png";

const QuizHeader = () => {
  return (
    <header>
      <nav className="header-nav">
        <div id="header-nav-left">
          <span>Snu-Perfume</span>
        </div>
        <div id="header-nav-right" />
      </nav>
      <div className="header-top">
        <div className="container">
          <div className="right-top-container" style={{ visibility: "hidden" }}>
            <Autocomplete
              style={{ width: "50%", border: "0" }}
              disablePortal
              id="combo-box-demo"
              options={["1", "2", "3", "4"]}
              sx={{
                width: 300,
                ".MuiOutlinedInput-root": {
                  borderRadius: 50,
                  borderColor: "red",
                  borderWidth: 0,
                },
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search aroma..."
                  size="small"
                />
              )}
            />
            <SearchIcon id="search-icon" style={{ fontSize: "2rem" }} />
          </div>
          <div className="center-top-container">
            <img id="aroma-icon" src={aroma_icon} alt="aroma" />
            <span id="site-name" style={{ fontSize: "1.4rem", color: "black" }}>
              Snu-Perfume
            </span>
          </div>
          <div className="left-top-container">
            <RouterLink
              id="home"
              style={{ borderRadius: "3%" }}
              component={RouterLink}
              to="/home"
            >
              Go to main
            </RouterLink>
          </div>
        </div>
        <div className="header-menu">
          <li id="aroma-list">
            <ul>Check perspectives</ul>
          </li>
        </div>
      </div>
    </header>
  );
};

export default QuizHeader;
