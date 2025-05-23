#include <windows.h>
#include <stdio.h>   // For sprintf_s
#include <shlwapi.h> // For PathRemoveFileSpecA
// #include <tchar.h> // Not strictly needed for this ANSI version

#pragma comment(lib, "Shlwapi.lib") // Link against Shlwapi.lib for PathRemoveFileSpecA

// Entry point for a Windows GUI application
int APIENTRY WinMain(HINSTANCE hInstance,
                     HINSTANCE hPrevInstance,
                     LPSTR     lpCmdLine,
                     int       nCmdShow) {
    CHAR szExePath[MAX_PATH];
    CHAR szBatPath[MAX_PATH];
    CHAR szCmdLine[MAX_PATH + 64]; // Room for "cmd.exe /C "" ... """
    CHAR szExeDir[MAX_PATH];

    STARTUPINFOA si;
    PROCESS_INFORMATION pi;

    UNREFERENCED_PARAMETER(hInstance);
    UNREFERENCED_PARAMETER(hPrevInstance);
    UNREFERENCED_PARAMETER(lpCmdLine);
    UNREFERENCED_PARAMETER(nCmdShow);

    ZeroMemory(&si, sizeof(si));
    si.cb = sizeof(si);
    // si.dwFlags = STARTF_USESHOWWINDOW; // Not strictly needed when using CREATE_NO_WINDOW
    // si.wShowWindow = SW_HIDE; // CREATE_NO_WINDOW in CreateProcess handles this

    ZeroMemory(&pi, sizeof(pi));

    // 1. Get the full path of the current executable (Devstia.exe)
    if (GetModuleFileNameA(NULL, szExePath, MAX_PATH) == 0) {
        // MessageBoxA(NULL, "Failed to get executable path.", "Launcher Error", MB_ICONERROR);
        return 1; // Error
    }

    // 2. Get the directory where Devstia.exe resides
    strncpy_s(szExeDir, MAX_PATH, szExePath, _TRUNCATE);
    if (!PathRemoveFileSpecA(szExeDir)) {
        // MessageBoxA(NULL, "Failed to determine executable directory.", "Launcher Error", MB_ICONERROR);
        return 1; // Error
    }
    // PathRemoveFileSpecA might remove the trailing backslash if it's not a root dir.
    // Ensure it's there for path concatenation.
    size_t len = strlen(szExeDir);
    if (len > 0 && szExeDir[len - 1] != '\\' && szExeDir[len - 1] != ':') {
         strncat_s(szExeDir, MAX_PATH, "\\", _TRUNCATE);
    }


    // 3. Construct the full path to Devstia.bat
    sprintf_s(szBatPath, MAX_PATH, "%sDevstia.bat", szExeDir);

    // 4. Construct the command line to execute the batch file silently
    sprintf_s(szCmdLine, sizeof(szCmdLine), "cmd.exe /C \"%s\"", szBatPath);

    // 5. Create the process for the batch file
    BOOL bSuccess = CreateProcessA(
        NULL,           // No module name (use command line)
        szCmdLine,      // Command line to execute
        NULL,           // Process handle not inheritable
        NULL,           // Thread handle not inheritable
        FALSE,          // Set handle inheritance to FALSE
        CREATE_NO_WINDOW, // Creation flags: crucial for hiding the cmd window
        NULL,           // Use parent's environment block
        szExeDir,       // Starting directory for the new process (directory of Devstia.bat)
        &si,            // Pointer to STARTUPINFO structure
        &pi             // Pointer to PROCESS_INFORMATION structure
    );

    if (!bSuccess) {
        // DWORD dwError = GetLastError();
        // CHAR szErrorMsg[256];
        // sprintf_s(szErrorMsg, sizeof(szErrorMsg), "Failed to create process. Error code: %lu", dwError);
        // MessageBoxA(NULL, szErrorMsg, "Launcher Error", MB_ICONERROR);
        return 1; // Error
    }

    // 6. Wait until the child process (cmd.exe running Devstia.bat) exits.
    WaitForSingleObject(pi.hProcess, INFINITE);

    // 7. Close process and thread handles.
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    return 0; // Success
}