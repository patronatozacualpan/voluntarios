/*
======================================================

MÓDULO BENEFECTORES

Patronato Zacualpan
Protección Civil Zacualpan

Archivo principal del módulo.

Su única responsabilidad es iniciar
los componentes del módulo.

======================================================
*/

window.PCZ = window.PCZ || {};

window.PCZ.Benefactores = {

    iniciar(){

        console.log(
            "✓ Módulo Benefactores iniciado."
        );

    }

};

/*=========================================
INICIAR
=========================================*/

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        window.PCZ.Benefactores.iniciar();

    }

);
