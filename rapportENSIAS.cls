\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{rapportENSIAS}[2026/10/01 Classe de rapport ENSIAS]

\LoadClass[a4paper,11pt,oneside]{report}

\RequirePackage[utf8]{inputenc}
\RequirePackage[T1]{fontenc}
\RequirePackage[french]{babel}
\RequirePackage[a4paper,margin=2.5cm]{geometry}
\RequirePackage{lmodern}
\RequirePackage{graphicx}
\RequirePackage{float}
\RequirePackage{tabularx}
\RequirePackage{multirow}
\RequirePackage{array}
\RequirePackage{longtable}
\RequirePackage{booktabs}
\RequirePackage{enumitem}
\RequirePackage{titlesec}
\RequirePackage{tocloft}
\RequirePackage{hyperref}
\RequirePackage{xcolor}
\RequirePackage{caption}
\RequirePackage{setspace}

\hypersetup{
    colorlinks=true,
    linkcolor=black,
    urlcolor=blue,
    pdfencoding=auto,
    pdftitle={Rapport de stage d'été - Gestion du parc informatique}
}

\setlength{\parindent}{0pt}
\setlength{\parskip}{0.4em}
\setlength{\arrayrulewidth}{0.4pt}
\renewcommand{\arraystretch}{1.25}
\setlength{\tabcolsep}{8pt}
\setcounter{tocdepth}{2}
\setcounter{secnumdepth}{3}
\renewcommand{\contentsname}{Table des matières}
\renewcommand{\listfigurename}{Liste des figures}
\renewcommand{\listtablename}{Liste des tableaux}
\renewcommand{\bibname}{Bibliographie}
\renewcommand{\chaptername}{Chapitre}
\setlength{\cftbeforechapskip}{6pt}

\makeatletter
\newcommand{\titre}[1]{\def\@titre{#1}}
\newcommand{\sujet}[1]{\def\@sujet{#1}}
\newcommand{\enseignant}[1]{\def\@enseignant{#1}}
\newcommand{\eleves}[1]{\def\@eleves{#1}}
\newcommand{\jury}[1]{\def\@jury{#1}}

\newcommand{\fairemarges}{%
    \geometry{top=2.5cm,bottom=2.5cm,left=2.5cm,right=2.5cm}%
}

\newcommand{\fairepagedegarde}{%
    \begin{titlepage}
        \centering
        \vspace*{1.5cm}
        {\Large \bfseries École Nationale Supérieure d'Informatique et d'Analyse des Systèmes\par}
        \vspace{1cm}
        {\Large \bfseries Rapport de stage d'été\par}
        \vspace{1.5cm}
        {\huge \bfseries \@titre\par}
        \vspace{0.8cm}
        {\Large \@sujet\par}
        \vspace{2cm}
        {\large \textbf{Présenté par :}\par}
        \vspace{0.5cm}
        {\large \@eleves\par}
        \vspace{1.5cm}
        {\large \textbf{Encadrant :} \@enseignant\par}
        \vfill
        {\large \textbf{Année universitaire : 2026-2027}\par}
    \end{titlepage}
}

\newcommand{\tabledematieres}{\tableofcontents}
\makeatother
