class Crew {
  constructor() {
    this.nome = "";
    this.tipo = "";
    this.reputacao = "";
    this.moedas= 0; //max 4
    this.cofre= 0; //max 12
    this.categoria = 0;
    this.controle = "forte";
    this.moral =0; // max 6
    this.bairro = "";
    this.covil = ""; //Short description

    this.flavor = "";
    this.habilidadesEspeciais = [];
    this.melhorias = [];
    this.contatos =  [];
   
    this.territorio = 0; // max 6
    this.status = "";

    this.atencao = 0 ; // max 8
    this.procuarado= 0; // max 4

    this.areasCaca = "";
    this.notas = "";


  }
  getCrewInfo() {
    return `Name: ${this.nome}, Type: ${this.tipo}`;
  }


  initCrew(nome = "X", tipo = "X", reputacao = "X") {
    let crew = new Crew();
    crew.nome = nome;
    crew.tipo = tipo;
    crew.reputacao = reputacao;
    crew.moedas = 2;
    crew.categoria = 0;
    crew.controle = "forte";
    crew.moral = 0; // max 6

    return crew;
  }



}