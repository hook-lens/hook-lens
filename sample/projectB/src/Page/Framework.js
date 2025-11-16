import { Link as RouterLink, Outlet } from "react-router-dom";
import { Autocomplete, Button, TextField } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import * as React from "react";
import { useRecoilValue } from "recoil";
import { useNavigate } from "react-router-dom";

import { logout } from "../Firebase/service";
import { aromaListState } from "../Store/selector";

import aroma_icon from "../Asset/aroma-icon.png";

import "../Styles/Dashboard.scss";
import "../Styles/Reset.css";

const Framework = () => {
  const navigate = useNavigate();
  const aromaList = useRecoilValue(aromaListState);
  const aromaNameList = aromaList.map((e) => e["name"]);

  const onClickNavigateDetail = () => {
    const box = document.querySelector("#combo-box-demo");
    const index = aromaList.findIndex((e) => e.name === box.value);

    if (index >= 0) {
      const id = aromaList[index].id;
      navigate(`/overviews/${id}`);
    } else {
      alert("Invalid aroma");
      return;
    }
  };
  aromaNameList.sort();

  const onClickCategory = (e) => {
    switch (e.target.innerText) {
      case "우디노트(숲 향)":
        navigate("/aroma/1");
        break;
      case "플로럴노트(꽃 향)":
        navigate("/aroma/2");
        break;
      case "프루티 노트(과실 향)":
        navigate("/aroma/3");
        break;
      case "허브노트":
        navigate("/aroma/4");
        break;
      default:
        break;
    }
  };

  const onClickNavigateHome = () => {
    navigate("/home");
  };
  return (
    <div>
      <header>
        <nav className="header-nav">
          <div id="header-nav-left">
            <span>Snu-Perfume</span>
          </div>
          <div id="header-nav-right">
            <Button
              id="logout-btn"
              style={{ height: "60%", color: "#707070" }}
              onClick={() => logout()}
            >
              로그아웃
            </Button>
          </div>
        </nav>
        <div className="header-top">
          <div className="container">
            <div className="right-top-container">
              <Autocomplete
                style={{ width: "50%", border: "0" }}
                disablePortal
                id="combo-box-demo"
                options={aromaNameList}
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
                    label="Search aromas..."
                    size="small"
                  />
                )}
              />
              <SearchIcon
                id="search-icon"
                style={{ fontSize: "2rem" }}
                onClick={() => onClickNavigateDetail()}
              />
            </div>
            <div className="center-top-container">
              <img
                id="aroma-icon"
                src={aroma_icon}
                alt="aroma"
                onClick={() => onClickNavigateHome()}
              />
              <span
                id="site-name"
                style={{ fontSize: "1.4rem", color: "black" }}
              >
                Snu-Perfume
              </span>
            </div>
            <div className="left-top-container">
              <RouterLink
                id="quiz"
                style={{ borderRadius: "3%" }}
                component={RouterLink}
                to="/quiz"
              >
                향수 성향 검사하러 가기
              </RouterLink>
            </div>
          </div>
          <div className="header-menu">
            <ul id="aroma-list">
              <li onClick={(e) => onClickCategory(e)}>우디노트(숲 향)</li>
              <li onClick={(e) => onClickCategory(e)}>플로럴노트(꽃 향)</li>
              <li onClick={(e) => onClickCategory(e)}>프루티 노트(과실 향)</li>
              <li onClick={(e) => onClickCategory(e)}>허브노트</li>
            </ul>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Framework;
