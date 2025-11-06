import {
  Paper,
  IconButton,
  Popper,
  List,
  ListItemText,
  ListItem,
  ListItemButton,
} from "@mui/material";
import { Settings } from "@mui/icons-material";
import { forwardRef, useImperativeHandle, useState } from "react";
import useTokenDarwin from "@/hooks/useTokenDarwin";
import useTokenExternal from "@/hooks/useTokenExternal";
import { useNavigate } from "react-router-dom";
import useAuthDarwinStore from "@/hooks/useAuthDarwinStore";
import useAuthExternStore from "@/hooks/useAuthExternStore";
import useTokenAssessee from "@/hooks/useTokenAssessee";
import { useTranslation } from "react-i18next";

export type SettingsToolbarRef = {
  logout: () => void;
};

const SettingsToolbar = forwardRef<SettingsToolbarRef, { setEditMode: (value: boolean) => void }>(
  ({ setEditMode }, ref) => {
    const { t } = useTranslation();
    const resetTokenAs = useTokenAssessee(state => state.resetTokenAss);
    const type = useTokenAssessee(state => state.type);
    const setDarwinStore = useAuthDarwinStore(state => state.setDarwinStore);
    const setExternStore = useAuthExternStore(state => state.setExternStore);
    const navigate = useNavigate();
    useImperativeHandle(ref, () => ({
      logout: logout,
    }));

    const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
    const [open, setOpen] = useState<boolean>(false);

    const onClick = (anchor: HTMLButtonElement) => {
      setAnchor(anchor);
    };

    const logout = () => {
      resetTokenAs();
      setDarwinStore(null);
      setExternStore(null);
      navigate("/login/client");
    };

    return (
      <>
        <IconButton
          onClick={e => {
            onClick(e.currentTarget);
            setOpen(prev => !prev);
          }}
        >
          <Settings />
        </IconButton>
        <Popper open={open} anchorEl={anchor} placement="top">
          <Paper>
            <List disablePadding>
              <ListItem>
                <ListItemButton
                  onClick={() => {
                    logout();
                  }}
                >
                  <ListItemText primary={t('logout')} />
                </ListItemButton>
              </ListItem>
              {type == "external" && (
                <ListItem>
                  <ListItemButton
                    onClick={() => {
                      setEditMode(true);
                      setOpen(false);
                    }}
                  >
                    <ListItemText primary="Edit" />
                  </ListItemButton>
                </ListItem>
              )}
            </List>
          </Paper>
        </Popper>
      </>
    );
  }
);

export default SettingsToolbar;
