import * as React from 'react';
import './Update.scss'
import { compare } from 'compare-versions';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
const API_ADDRESS = 'https://api.github.com/';


interface storageFormat {
    version: string,
    lastGetLatestVersionCheckTime: number | undefined,
    theme: string | undefined
}

export const Update: React.FunctionComponent<{}> = ({ }) => {

    const [lastUpdated, setLastUpdated] = React.useState<number>(undefined);
    const [lastVersionCheck, setLastVersionCheck] = React.useState<number>(undefined);
    const [latestVersion, setLatestVersion] = React.useState<string>(undefined);
    const [newInstallAvailable, setNewInstallAvailable] = React.useState<boolean>(undefined);
    const [installedVersion, setInstalledVersion] = React.useState<string>("");
    const [versions, setVersions] = React.useState<string[]>(undefined);

    React.useEffect(() => {
        console.log('render!');

        chrome.storage.local.get('storageFile', (result) => {
            const storageFile = result.storageFile as storageFormat;
            console.log(storageFile);
            setInstalledVersion(storageFile.version);
        });
        const nextCheckOffset = new Date();
        nextCheckOffset.setMinutes(20);
        nextCheckOffset.getTime;

        if (latestVersion === undefined || versions === undefined || Date.now() > (lastVersionCheck + nextCheckOffset.getTime())) {
            getLatestReleaseDetails();
            getAllReleaseTags();
        }
        determineNeedsUpdate();

    })

    function getAllReleaseTags() {
        console.log('getAllReleaseTags!');
        return fetch(API_ADDRESS + `repos/acoop133/githubdarktheme/tags`)
            .then(response => response.json())
            .then((data) => {
                const dataTyped = data as any[];
                console.log(dataTyped);
                const options = dataTyped.map(d => {
                    console.warn(d.name);
                    return d.name;
                });

                setVersions(options);
            })
            .catch(function (error) {
                // handle error
                console.error(error);
            });
    }


    function getLatestReleaseDetails() {
        console.log('getLatestReleaseDetails!');
        return fetch(API_ADDRESS + `repos/acoop133/githubdarktheme/releases/latest`)
            .then(response => response.json())
            .then(data => {
                //console.log(data);
                setLatestVersion(data.tag_name);
                determineNeedsUpdate();
            })
            .catch(function (error) {
                // handle error
                console.error(error);
            }).then(() => {
                setLastVersionCheck(Date.now());
            });

    }

    function determineNeedsUpdate() {
        console.log('determineNeedsUpdate!');
        console.log('latest:' + latestVersion);
        console.log('installed:' + installedVersion);
        if (installedVersion === "") {
            setNewInstallAvailable(true);
        }
        else if (latestVersion === undefined) {
            console.error("latest version is undefined but should have value")
        } else {
            console.log("start compare")
            setNewInstallAvailable(compare(latestVersion, installedVersion, '>'));
            console.log("complete compare")
        }
    }

    function InstallThemeVersion(version: string) {
        console.log('InstallThemeVersion!');
        console.log(version);
        getLatestReleaseDetails();
        fetch("https://raw.githubusercontent.com/acoop133/GithubDarkTheme/" + { version } + "/Theme.css")
            .then(response => response.text())
            .then(data => {
                const toStorage: storageFormat = {
                    version: version,
                    lastGetLatestVersionCheckTime: lastVersionCheck,
                    theme: data
                }
                chrome.storage.local.set({ "storageFile": toStorage });
                setInstalledVersion(version);
                setNewInstallAvailable(false);
            })
            .catch(function (error) {
                // handle error
                console.error(error);
            });
    }

    const uninstallTheme = () => {
        console.log('uninstallTheme!');
        chrome.storage.local.clear(() => {
            setInstalledVersion("");
            getLatestReleaseDetails();
        });
    }
    const updateAvailableNotification = () => {
        chrome.notifications.create({
            title: "New Update Available",
            buttons: [
                { title: "Release Notes" },
                { title: "Update now" },
                { title: "Enable Auto Update" }],
            message: "A new update for Github Darktheme is available",
            type: 'basic',
            iconUrl: undefined
        });
    }
    function onChange(event) {
        InstallThemeVersion(event.target.value)
    };

    return <div className="update-grid">
        <div className="grid-item" style={{ paddingRight: 20 }}>
            <span style={{ float: "right" }}>Latest version:</span>
        </div>
        <div className="grid-item">
            {latestVersion} <span className="small-text">checked {(Date.now() - lastUpdated)} ago</span>
        </div>
        <div className="grid-item" style={{ paddingRight: 20 }}>
            <div style={{ alignItems: 'baseline', float: "right" }}>Installed version:</div>
        </div>
        <div className="grid-item">
            <Select
                value={installedVersion}
                onChange={onChange}
                displayEmpty
            >
                <MenuItem value="" disabled>Select a version to install</MenuItem>
                {versions && versions.map(v => {
                    return <MenuItem value={v}>{v}</MenuItem>
                })}
            </Select>
            {installedVersion !== "" && <button onClick={() => uninstallTheme()}>Uninstall Theme</button>}
        </div>
        <div className="button-row">
            <button onClick={() => { chrome.tabs.create({ url: 'https://github.com/acoop133/GithubDarkTheme/releases' }) }}>Release Notes</button>
        </div>
    </div >

}
